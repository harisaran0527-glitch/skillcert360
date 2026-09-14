import { randomInt, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAssessmentSettings } from "@/lib/settings";
import { studentTransaction, transition, WorkflowError, type Tx } from "@/lib/workflow";
import { assertSkillLevelUnlocked } from "@/lib/progression";

const include = { answers: { orderBy: { position: "asc" as const }, include: { question: true } }, violations: true };
type Attempt = Prisma.AssessmentAttemptGetPayload<{ include: typeof include }>;
export const responsesSchema = z.record(z.string(), z.union([z.string().max(10000), z.array(z.string().max(2000)).max(100)]));
export const clientSchema = z.string().uuid();
export const violationTypes = z.enum(["TAB_SWITCH", "WINDOW_BLUR", "PAGE_HIDDEN", "FULLSCREEN_EXIT"]);
const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = randomInt(i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
};
function canonical(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify([...new Set(value.map(canonical))].sort());
  if (typeof value === "boolean") return String(value);
  return String(value ?? "").trim().toLowerCase();
}
export function isCorrect(answer: unknown, expected: unknown) {
  if (answer === "" || answer == null || (Array.isArray(answer) && !answer.length)) return false;
  return canonical(answer) === canonical(expected);
}
async function finalize(tx: Tx, attempt: Attempt, reason: "MANUAL" | "TIMEOUT" | "VIOLATION_LIMIT") {
  if (attempt.submittedAt) return attempt;
  const score = attempt.answers.filter(a => isCorrect(a.answer, a.correctAnswerSnapshot ?? a.question.correctAnswer)).length;
  const terminated = reason === "VIOLATION_LIMIT" && !attempt.autoSubmitOnViolation;
  const passed = !terminated && score >= attempt.passMark;
  const submittedAt = reason === "TIMEOUT" ? attempt.expiresAt : new Date();
  const updated = await tx.assessmentAttempt.update({ where: { id: attempt.id }, data: {
    score, passed, submittedAt, terminated, autoSubmitted: reason !== "MANUAL", submissionReason: reason,
    reexamAvailableAt: passed ? null : new Date(submittedAt.getTime() + attempt.cooldownHours * 3600000), clientLeaseUntil: null,
  }, include });
  await transition(tx, attempt.studentId, attempt.skillId, passed ? ["ASSESSMENT_PASSED"] : ["ASSESSMENT_FAILED", "REEXAM_REQUIRED"], { attemptId: attempt.id, score, reason });
  if (passed) {
    const enrollment = await tx.studentSkill.findUnique({ where: { studentId_skillId: { studentId: attempt.studentId, skillId: attempt.skillId } }, include: { selectedCourse: true } });
    const course = enrollment?.selectedCourse;
    const request = await tx.certificate.findUnique({ where: { studentId_skillId: { studentId: attempt.studentId, skillId: attempt.skillId } } });
    if (!enrollment?.completedAt || !course || course.skillId !== attempt.skillId || request?.courseId !== course.id || !request.submittedAt) return updated;
    const attribution = course ? { courseId: course.id, providerId: course.providerId, credentialType: course.credentialType, credentialName: course.title ?? course.name } : {};
    await tx.certificate.upsert({ where: { studentId_skillId: { studentId: attempt.studentId, skillId: attempt.skillId } },
      create: { studentId: attempt.studentId, skillId: attempt.skillId, status: "UNLOCKED", issuedAt: submittedAt, ...attribution }, update: { status: "UNLOCKED", issuedAt: submittedAt, ...attribution } });
    await transition(tx, attempt.studentId, attempt.skillId, ["CERTIFICATE_UNLOCKED"], { attemptId: attempt.id });
  } else {
    const existingPass = await tx.assessmentAttempt.findFirst({
      where: {
        studentId: attempt.studentId,
        skillId: attempt.skillId,
        passed: true,
        terminated: false,
        NOT: { submittedAt: null },
      },
    });
    if (!existingPass) {
      await tx.certificate.updateMany({ where: { studentId: attempt.studentId, skillId: attempt.skillId }, data: { status: "LOCKED" } });
    }
  }
  return updated;
}
export async function expireStudentAttempts(studentId?: string) {
  const overdue = await db.assessmentAttempt.findMany({ where: { studentId, submittedAt: null, expiresAt: { lte: new Date() } }, select: { id: true, studentId: true } });
  for (const row of overdue) await studentTransaction(row.studentId, async tx => {
    const attempt = await tx.assessmentAttempt.findUniqueOrThrow({ where: { id: row.id }, include });
    if (!attempt.submittedAt) await finalize(tx, attempt, "TIMEOUT");
  });
}
export async function startAssessment(studentId: string, skillId: string) {
  await expireStudentAttempts(studentId);
  const settings = await getAssessmentSettings();
  return studentTransaction(studentId, async tx => {
    const skill = await tx.skill.findUnique({ where: { id: skillId }, include: { level: true, prerequisites: true } });
    if (!skill?.active || !skill.level.active) throw new WorkflowError("Skill unavailable", 404);
    const enrollment = await tx.studentSkill.findUnique({ where: { studentId_skillId: { studentId, skillId } }, include: { selectedCourse: true } });
    if (!enrollment?.completedAt) throw new WorkflowError("Complete official learning before starting an assessment.");
    const request = await tx.certificate.findUnique({ where: { studentId_skillId: { studentId, skillId } } });
    if (!enrollment.selectedCourse || enrollment.selectedCourse.skillId !== skillId || !request?.submittedAt || request.courseId !== enrollment.selectedCourseId) {
      throw new WorkflowError("Submit the certificate request for your selected course before starting an assessment.");
    }
    // Level-lock check: verify the student's progression allows this skill's level.
    await assertSkillLevelUnlocked(studentId, skillId);
    for (const prerequisite of skill.prerequisites) {
      const prior = await tx.studentSkill.findUnique({ where: { studentId_skillId: { studentId, skillId: prerequisite.prerequisiteId } } });
      if (!prior?.verifiedAt && (settings.certificateRequirement || !await tx.assessmentAttempt.findFirst({ where: { studentId, skillId: prerequisite.prerequisiteId, passed: true } }))) throw new WorkflowError("Complete the prerequisite skills first.");
    }
    const active = await tx.assessmentAttempt.findFirst({ where: { studentId, submittedAt: null } });
    if (active) {
      if (active.skillId === skillId) return active;
      throw new WorkflowError("Finish your active assessment before starting another.");
    }
    const history = await tx.assessmentAttempt.findMany({ where: { studentId, skillId }, orderBy: { startedAt: "desc" }, include: { answers: { select: { questionId: true } } } });
    if (history.some(a => a.passed && !a.terminated && a.submittedAt)) throw new WorkflowError("You already passed this assessment.");
    const last = history[0];
    const available = last?.reexamAvailableAt ?? (last?.submittedAt ? new Date(last.submittedAt.getTime() + last.cooldownHours * 3600000) : null);
    if (available && available > new Date()) throw new WorkflowError(`Re-exam available at ${available.toISOString()}`, 429);
    const courseId = enrollment.selectedCourseId;
    const bank = courseId
      ? await tx.question.findMany({ where: { courseId, active: true, type: { in: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"] } } })
      : await tx.question.findMany({ where: { skillId, active: true, type: { in: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"] } } });
    if (bank.length < settings.questionCount) throw new WorkflowError(`Assessment needs ${settings.questionCount} active, automatically gradable questions; ${bank.length} available.`);
    const previous = new Set(last?.answers.map(a => a.questionId) ?? []);
    const selected = shuffle([...shuffle(bank.filter(q => !previous.has(q.id))), ...shuffle(bank.filter(q => previous.has(q.id)))].slice(0, settings.questionCount));
    const passMark = settings.passMarksByLevel[skill.level.name] ?? skill.level.passMark;
    if (passMark < 1 || passMark > selected.length) throw new WorkflowError("Admin must set a pass mark between 1 and the question count.");
    const startedAt = new Date();
    const attempt = await tx.assessmentAttempt.create({ data: {
      token: randomUUID(), studentId, skillId, startedAt, expiresAt: new Date(startedAt.getTime() + settings.durationMinutes * 60000),
      attemptNumber: history.length + 1, questionCount: selected.length, passMark, violationLimit: settings.violationLimit,
      cooldownHours: settings.cooldownHours, autoSubmitOnViolation: settings.autoSubmitOnViolation, certificateRequired: settings.certificateRequirement,
      answers: { create: selected.map((q, position) => {
        const rawOpts = Array.isArray(q.options) ? (q.options as string[]) : [];
        const opts = q.type === "TRUE_FALSE" ? ["True", "False"] : shuffle(rawOpts);
        return { questionId: q.id, position, answer: "", correctAnswerSnapshot: q.correctAnswer as Prisma.InputJsonValue,
          questionSnapshot: { id: q.id, prompt: q.prompt, type: q.type, options: opts } };
      }) },
    } });
    await transition(tx, studentId, skillId, ["ASSESSMENT_IN_PROGRESS"], { attemptId: attempt.id, attemptNumber: attempt.attemptNumber });
    return attempt;
  });
}
function publicAttempt(attempt: Attempt) {
  return { id: attempt.id, startedAt: attempt.startedAt, expiresAt: attempt.expiresAt, serverNow: new Date(), submittedAt: attempt.submittedAt,
    violationCount: attempt.violations.length, violationLimit: attempt.violationLimit, attemptNumber: attempt.attemptNumber,
    autoSubmitOnViolation: attempt.autoSubmitOnViolation, passMark: attempt.passMark,
    questions: attempt.submittedAt ? [] : attempt.answers.map(a => a.questionSnapshot ?? { id: a.question.id, prompt: a.question.prompt, type: a.question.type, options: a.question.options ?? [] }),
    responses: Object.fromEntries(attempt.answers.map(a => [a.questionId, a.answer])),
    redirect: attempt.submittedAt ? `/student/results/${attempt.id}` : null };
}
export async function assessmentAction(userId: string, id: string, clientId: string, action: "claim" | "heartbeat" | "save" | "submit" | "violation", responses: Record<string, string | string[]> = {}, types: string[] = []) {
  const profile = await db.studentProfile.findUnique({ where: { userId } });
  if (!profile) throw new WorkflowError("Not found", 404);
  return studentTransaction(profile.id, async tx => {
    let attempt = await tx.assessmentAttempt.findFirst({ where: { id, studentId: profile.id }, include });
    if (!attempt) throw new WorkflowError("Not found", 404);
    if (attempt.submittedAt) return publicAttempt(attempt);
    if (attempt.expiresAt <= new Date()) return publicAttempt(await finalize(tx, attempt, "TIMEOUT"));
    if (action === "claim") {
      if (attempt.clientId && attempt.clientId !== clientId && attempt.clientLeaseUntil && attempt.clientLeaseUntil > new Date()) throw new WorkflowError("This assessment is active in another tab or device. Close it and wait 20 seconds before resuming.");
    } else if (attempt.clientId !== clientId) throw new WorkflowError("Assessment tab ownership required", 403);
    attempt = await tx.assessmentAttempt.update({ where: { id }, data: { clientId, clientLeaseUntil: new Date(Date.now() + 20000) }, include });
    if (action === "save" || action === "submit") {
      const assigned = new Set(attempt.answers.map(a => a.questionId));
      if (Object.keys(responses).some(qid => !assigned.has(qid))) throw new WorkflowError("Response contains an unassigned question", 400);
      for (const [questionId, answer] of Object.entries(responses)) await tx.assessmentAnswer.update({ where: { attemptId_questionId: { attemptId: id, questionId } }, data: { answer, answeredAt: new Date() } });
      attempt = await tx.assessmentAttempt.findUniqueOrThrow({ where: { id }, include });
    }
    if (action === "violation") {
      for (const type of types) await tx.assessmentViolation.create({ data: { attemptId: id, studentId: profile.id, type, metadata: { source: "browser", clientId } } });
      await tx.activityLog.create({ data: { studentId: profile.id, action: "ASSESSMENT_VIOLATION", metadata: { attemptId: id, types } } });
      attempt = await tx.assessmentAttempt.findUniqueOrThrow({ where: { id }, include });
      if (attempt.violations.length >= attempt.violationLimit) attempt = await finalize(tx, attempt, "VIOLATION_LIMIT");
    }
    if (action === "submit") attempt = await finalize(tx, attempt, "MANUAL");
    return publicAttempt(attempt);
  });
}
