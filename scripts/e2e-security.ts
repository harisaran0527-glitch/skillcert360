import { expect, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { isCorrect } from "../src/lib/assessment";
export async function securityChecks(db: PrismaClient, admin: BrowserContext, student: BrowserContext, fixture: { skillId: string; departmentId: string; sectionId: string; tag: string }, checks: (message: string) => void) {
 const email = fixture.tag.toLowerCase() + "-security@example.test";
 const password = "Secure-" + randomUUID();
 const extra = await db.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12), role: "STUDENT", studentProfile: { create: { fullName: fixture.tag + " Security", registerNumber: fixture.tag + "-SEC", departmentId: fixture.departmentId, sectionId: fixture.sectionId, year: 2 } } }, include: { studentProfile: true } });
 const profile = extra.studentProfile!;
 const api = await (await import("@playwright/test")).request.newContext({ baseURL: process.env.E2E_BASE_URL || "http://localhost:3000" });
 const post = (path: string, data: object) => api.post(path, { data, maxRedirects: 0 });
 const settings = async (autoSubmit: boolean, limit: number) => {
  const levels = await db.skillLevel.findMany();
  const form: Record<string, string> = { assessmentQuestionCount: "2", assessmentDurationMinutes: "3", assessmentViolationLimit: String(limit), assessmentCooldownHours: "0", ...(autoSubmit ? { autoSubmitOnViolation: "on" } : {}) };
  for (const level of levels) form["passMarks." + level.name] = "1";
  expect((await admin.request.post("/api/admin/settings", { form, maxRedirects: 0 })).status()).toBe(303);
 };
 try {
  await api.post("/api/auth/student/login", { form: { identifier: email, password }, maxRedirects: 0 });
  await db.studentSkill.create({ data: { studentId: profile.id, skillId: fixture.skillId, completedAt: new Date(), state: "ASSESSMENT_AVAILABLE" } });
  const course = await db.course.findFirstOrThrow({ where: { skillId: fixture.skillId } });
  // These are boundary fixtures. The full learning workflow is tested in the UI suite.
  const begin = async () => {
   const response = await post("/api/student/assessment/start", { skillId: fixture.skillId });
   expect(response.status()).toBe(303);
   const id = response.headers().location.split("/").pop()!;
   const clientId = randomUUID();
   const claim = await post("/api/student/assessment/" + id + "/claim", { clientId });
   expect(claim.status()).toBe(200);
   return { id, clientId, data: await claim.json() };
  };
  let attempt = await begin();
  await settings(false, 4);
  expect((await db.adminSetting.findUniqueOrThrow({ where: { key: "autoSubmitOnViolation" } })).value).toBe(false);
  expect((await db.adminSetting.findUniqueOrThrow({ where: { key: "certificateRequirement" } })).value).toBe(false);
  expect((await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id } })).autoSubmitOnViolation).toBe(true);
  expect(isCorrect(["B", "A"], ["A", "B"])).toBe(true);
  expect(isCorrect("True", true)).toBe(true);
  expect(isCorrect(["A"], ["A", "B"])).toBe(false);
  checks("Unchecked settings persist as false; active rules are immutable; boolean and multi-choice grading");
  for (const action of ["claim", "save", "submit", "violation", "heartbeat"]) {
   expect((await student.request.post("/api/student/assessment/" + attempt.id + "/" + action, { data: { clientId: attempt.clientId, ...(action === "violation" ? { types: ["WINDOW_BLUR"] } : {}) } })).status()).toBe(404);
  }
  expect((await api.post("/api/admin/settings", { form: {} })).status()).toBe(403);
  const key = attempt.data.questions[0].id;
  await post("/api/student/assessment/" + attempt.id + "/save", { clientId: attempt.clientId, responses: { [key]: "Correct" } });
  // Force a near-boundary expiry on this isolated fixture, then let real server time elapse.
  await db.assessmentAttempt.update({ where: { id: attempt.id }, data: { expiresAt: new Date(Date.now() + 1500), passMark: 2 } });
  await new Promise(resolve => setTimeout(resolve, 1700));
  await post("/api/student/assessment/" + attempt.id + "/submit", { clientId: attempt.clientId, responses: Object.fromEntries(attempt.data.questions.map((q: { id: string }) => [q.id, "Correct"])) });
  const timeout = await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
  expect(timeout.score).toBe(1); expect(timeout.passed).toBe(false); expect(timeout.autoSubmitted).toBe(true); expect(timeout.submissionReason).toBe("TIMEOUT");
  checks("Cross-student ownership and admin role checks; late answers excluded by server deadline");
  await db.assessmentAttempt.update({ where: { id: attempt.id }, data: { reexamAvailableAt: new Date(Date.now() - 1000) } });
  attempt = await begin();
  expect((await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id } })).autoSubmitOnViolation).toBe(false);
  await post("/api/student/assessment/" + attempt.id + "/save", { clientId: attempt.clientId, responses: Object.fromEntries(attempt.data.questions.map((q: { id: string }) => [q.id, "Correct"])) });
  const signals = ["WINDOW_BLUR", "TAB_SWITCH", "PAGE_HIDDEN", "FULLSCREEN_EXIT"];
  await Promise.all(signals.map(type => post("/api/student/assessment/" + attempt.id + "/violation", { clientId: attempt.clientId, types: [type] })));
  const terminated = await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id }, include: { violations: true } });
  expect(terminated.terminated).toBe(true); expect(terminated.passed).toBe(false); expect(terminated.score).toBe(2);
  expect(terminated.violations.length).toBe(4); expect(terminated.violations.every(v => v.occurredAt instanceof Date)).toBe(true);
  expect(await db.certificate.count({ where: { studentId: profile.id } })).toBe(0);
  await db.assessmentAttempt.update({ where: { id: attempt.id }, data: { reexamAvailableAt: new Date(Date.now() - 1000) } });
  await settings(true, 1);
  attempt = await begin();
  await post("/api/student/assessment/" + attempt.id + "/save", { clientId: attempt.clientId, responses: { [attempt.data.questions[0].id]: "Correct" } });
  await post("/api/student/assessment/" + attempt.id + "/violation", { clientId: attempt.clientId, types: ["WINDOW_BLUR"] });
  const auto = await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
  expect(auto.autoSubmitted).toBe(true); expect(auto.terminated).toBe(false); expect(auto.passed).toBe(true);
  expect((await db.certificate.findUniqueOrThrow({ where: { studentId_skillId: { studentId: profile.id, skillId: fixture.skillId } } })).status).toBe("UNLOCKED");
  checks("Concurrent violation logging, configured termination versus auto-submit, and certificate gating");
  await db.user.update({ where: { id: extra.id }, data: { status: "DISABLED" } });
  expect((await post("/api/student/learning", { skillId: fixture.skillId, courseId: course.id, action: "learn" })).status()).toBe(403);
  checks("Disabled accounts lose access even with an existing session");
 } finally {
  await api.dispose();
  await db.activityLog.deleteMany({ where: { OR: [{ studentId: profile.id }, { userId: extra.id }] } });
  await db.studentProfile.delete({ where: { id: profile.id } });
  await db.user.delete({ where: { id: extra.id } });
 }
}
