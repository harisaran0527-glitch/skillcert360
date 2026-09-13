import { expect as baseExpect, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { isCorrect } from "../src/lib/assessment";
import { pathToFileURL } from "node:url";
const expect = baseExpect.configure({ timeout: 20000 });
export async function securityChecks(db: PrismaClient, admin: BrowserContext, student: BrowserContext, fixture: { skillId: string; departmentId: string; sectionId: string; tag: string }, checks: (message: string) => void) {
 const email = fixture.tag.toLowerCase() + "-security@example.test";
 const password = "Secure-" + randomUUID();
 const extra = await db.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12), role: "STUDENT", studentProfile: { create: { fullName: fixture.tag + " Security", registerNumber: fixture.tag + "-SEC", departmentId: fixture.departmentId, sectionId: fixture.sectionId, year: 2 } } }, include: { studentProfile: true } });
 const profile = extra.studentProfile!;
 const context = await student.browser()!.newContext({ baseURL: process.env.E2E_BASE_URL || "http://localhost:3000" });
 const api = context.request;
 const page = await context.newPage();
 const pageErrors: string[] = [];
 page.on("pageerror", error => pageErrors.push(error.message));
 const post = (path: string, data: object) => api.post(path, { data, maxRedirects: 0 });
 let relatedSkillId = "";
 const settings = async (autoSubmit: boolean, limit: number, certificateRequired = false) => {
  const levels = await db.skillLevel.findMany();
  const form: Record<string, string> = { assessmentQuestionCount: "2", assessmentDurationMinutes: "3", assessmentViolationLimit: String(limit), assessmentCooldownHours: "0", ...(autoSubmit ? { autoSubmitOnViolation: "on" } : {}), ...(certificateRequired ? { certificateRequirement: "on" } : {}) };
  for (const level of levels) form["passMarks." + level.name] = "1";
  expect((await admin.request.post("/api/admin/settings", { form, maxRedirects: 0 })).status()).toBe(303);
 };
 try {
  await api.post("/api/auth/student/login", { form: { identifier: email, password }, maxRedirects: 0 });
  await db.studentSkill.create({ data: { studentId: profile.id, skillId: fixture.skillId, completedAt: new Date(), state: "ASSESSMENT_AVAILABLE" } });
  const course = await db.course.findFirstOrThrow({ where: { skillId: fixture.skillId } });
  const sourceSkill = await db.skill.findUniqueOrThrow({ where: { id: fixture.skillId } });
  const related = await db.skill.create({ data: { name: fixture.tag + " Related", slug: fixture.tag.toLowerCase() + "-related", categoryId: sourceSkill.categoryId, levelId: sourceSkill.levelId } });
  relatedSkillId = related.id;
  await db.studentSkill.create({ data: { studentId: profile.id, skillId: related.id, completedAt: new Date(), state: "ASSESSMENT_AVAILABLE" } });
  await db.question.createMany({ data: Array.from({ length: 2 }, (_, index) => ({ skillId: related.id, levelId: sourceSkill.levelId, type: "SINGLE_CHOICE" as const, difficulty: "EASY" as const, prompt: "Related question " + index, options: ["Correct", "Incorrect"], correctAnswer: "Correct" })) });
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
  const starts = await Promise.all([post("/api/student/assessment/start", { skillId: fixture.skillId }), post("/api/student/assessment/start", { skillId: fixture.skillId })]);
  expect(starts.every(response => response.status() === 303)).toBe(true);
  expect(starts[0].headers().location).toBe(starts[1].headers().location);
  expect(await db.assessmentAttempt.count({ where: { studentId: profile.id, submittedAt: null } })).toBe(1);
  checks("Simultaneous first starts create exactly one active attempt");
  let attempt = await begin();
  expect((await post("/api/student/assessment/start", { skillId: related.id })).status()).toBe(409);
  checks("A second skill cannot start while another assessment is active");
  const enterBrowser = async () => {
   await page.addInitScript(({ key, value }) => sessionStorage.setItem(key, value), { key: "skillcert_tab_" + attempt.id, value: attempt.clientId });
   await page.goto("/student/assessment/" + attempt.id);
   await page.getByRole("button", { name: "Enter Secure Assessment Environment" }).click();
   await expect(page.getByRole("button", { name: "Submit Assessment", exact: true })).toBeVisible();
  };
  await settings(false, 4);
  expect((await db.adminSetting.findUniqueOrThrow({ where: { key: "autoSubmitOnViolation" } })).value).toBe(false);
  expect((await db.adminSetting.findUniqueOrThrow({ where: { key: "certificateRequirement" } })).value).toBe(false);
  expect((await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id } })).autoSubmitOnViolation).toBe(true);
  expect(isCorrect(["B", "A"], ["A", "B"])).toBe(true);
  expect(isCorrect("True", true)).toBe(true);
  expect(isCorrect(["A"], ["A", "B"])).toBe(false);
  checks("Unchecked settings persist as false; active rules are immutable; boolean and multi-choice grading");
  for (const action of ["claim", "save", "submit", "violation", "heartbeat"]) {
   expect((await student.request.post((process.env.E2E_BASE_URL || "http://localhost:3000") + "/api/student/assessment/" + attempt.id + "/" + action, { data: { clientId: attempt.clientId, ...(action === "violation" ? { types: ["WINDOW_BLUR"] } : {}) } })).status()).toBe(404);
  }
  expect((await api.post("/api/admin/settings", { form: {} })).status()).toBe(403);
  const key = attempt.data.questions[0].id;
  const unassignedRes = await post("/api/student/assessment/" + attempt.id + "/save", { clientId: attempt.clientId, responses: { "invalid-question-id": "Correct" } });
  expect(unassignedRes.status()).toBe(400);
  const tamperRes = await post("/api/student/assessment/" + attempt.id + "/submit", { clientId: attempt.clientId, score: 100, passed: true, responses: { [key]: "Correct" } });
  expect(tamperRes.status()).toBe(400);
  checks("Answer injection and score tampering payloads strictly rejected");
  await post("/api/student/assessment/" + attempt.id + "/save", { clientId: attempt.clientId, responses: { [key]: "Correct" } });
  // Force a near-boundary expiry on this isolated fixture, then let real server time elapse.
  await db.assessmentAttempt.update({ where: { id: attempt.id }, data: { expiresAt: new Date(Date.now() + 1500), passMark: 2 } });
  await new Promise(resolve => setTimeout(resolve, 1700));
  await post("/api/student/assessment/" + attempt.id + "/submit", { clientId: attempt.clientId, responses: Object.fromEntries(attempt.data.questions.map((q: { id: string }) => [q.id, "Correct"])) });
  const timeout = await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
  expect(timeout.score).toBe(1); expect(timeout.passed).toBe(false); expect(timeout.autoSubmitted).toBe(true); expect(timeout.submissionReason).toBe("TIMEOUT");
  const dupRes = await post("/api/student/assessment/" + attempt.id + "/submit", { clientId: attempt.clientId, responses: {} });
  expect(dupRes.status()).toBe(200);
  const dupAttempt = await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
  expect(dupAttempt.score).toBe(1); expect(dupAttempt.submittedAt?.getTime()).toBe(timeout.submittedAt?.getTime());
  checks("Cross-student ownership and admin role checks; late answers excluded by server deadline; duplicate submission idempotency verified");
  await db.assessmentAttempt.update({ where: { id: attempt.id }, data: { reexamAvailableAt: new Date(Date.now() - 1000) } });
  attempt = await begin();
  expect((await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id } })).autoSubmitOnViolation).toBe(false);
  await post("/api/student/assessment/" + attempt.id + "/save", { clientId: attempt.clientId, responses: Object.fromEntries(attempt.data.questions.map((q: { id: string }) => [q.id, "Correct"])) });
  const signals = ["WINDOW_BLUR", "TAB_SWITCH", "PAGE_HIDDEN"];
  const violations = await Promise.all(signals.map(type => post("/api/student/assessment/" + attempt.id + "/violation", { clientId: attempt.clientId, types: [type] })));
  expect(violations.every(response => response.ok())).toBe(true);
  expect((await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id } })).submittedAt).toBeNull();
  expect(await db.assessmentViolation.count({ where: { attemptId: attempt.id } })).toBe(3);
  await enterBrowser();
  await expect(page.getByText(/Violations: 3\s*\/\s*4/)).toBeVisible();
  await post("/api/student/assessment/" + attempt.id + "/violation", { clientId: attempt.clientId, types: ["FULLSCREEN_EXIT"] });
  await page.goto(process.env.E2E_BASE_URL || "http://localhost:3000" + "/student/results/" + attempt.id);
  await expect(page.getByText("FAILED", { exact: true })).toBeVisible();
  const terminated = await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id }, include: { violations: true } });
  expect(terminated.terminated).toBe(true); expect(terminated.passed).toBe(false); expect(terminated.score).toBe(2);
  expect(terminated.violations.length).toBe(4); expect(terminated.violations.every(v => v.occurredAt instanceof Date)).toBe(true);
  expect(terminated.submissionReason).toBe("VIOLATION_LIMIT");
  expect(await db.certificate.count({ where: { studentId: profile.id } })).toBe(0);
  await db.assessmentAttempt.update({ where: { id: attempt.id }, data: { reexamAvailableAt: new Date(Date.now() - 1000) } });
  await settings(true, 1);
  attempt = await begin();
  await post("/api/student/assessment/" + attempt.id + "/save", { clientId: attempt.clientId, responses: { [attempt.data.questions[0].id]: "Correct" } });
  await enterBrowser();
  await expect(page.getByText(/Violations: 0\s*\/\s*1/)).toBeVisible();
  await post("/api/student/assessment/" + attempt.id + "/violation", { clientId: attempt.clientId, types: ["FULLSCREEN_EXIT"] });
  await page.goto((process.env.E2E_BASE_URL || "http://localhost:3000") + "/student/results/" + attempt.id);
  await expect(page.getByText("PASSED", { exact: true })).toBeVisible();
  const auto = await db.assessmentAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
  expect(auto.autoSubmitted).toBe(true); expect(auto.terminated).toBe(false); expect(auto.passed).toBe(true);
  expect(auto.submissionReason).toBe("VIOLATION_LIMIT"); expect(auto.score).toBe(1);
  expect(await db.assessmentViolation.count({ where: { attemptId: attempt.id } })).toBe(1);
  expect((await db.certificate.findUniqueOrThrow({ where: { studentId_skillId: { studentId: profile.id, skillId: fixture.skillId } } })).status).toBe("UNLOCKED");
  expect(pageErrors).toEqual([]);
  checks("Concurrent violation logging; browser counts 3/4 and 0/1; real fullscreen exit triggers termination or auto-submit exactly at the configured limit; certificate gating");
  await db.skillPrerequisite.create({ data: { skillId: related.id, prerequisiteId: fixture.skillId } });
  await settings(true, 1, true);
  expect((await post("/api/student/assessment/start", { skillId: related.id })).status()).toBe(409);
  await settings(true, 1, false);
  expect((await post("/api/student/assessment/start", { skillId: related.id })).status()).toBe(303);
  expect((await post("/api/student/certificates", { skillId: related.id, credentialId: "BYPASS", issuedAt: "2026-01-01" })).status()).toBe(409);
  checks("Certificate requirement setting enforces verified prerequisites when enabled and passed prerequisites when disabled; own assessment pass remains mandatory");
  await db.user.update({ where: { id: extra.id }, data: { status: "DISABLED" } });
  expect((await post("/api/student/learning", { skillId: fixture.skillId, courseId: course.id, action: "learn" })).status()).toBe(403);
  checks("Disabled accounts lose access even with an existing session");
 } finally {
  await context.close();
  await db.activityLog.deleteMany({ where: { OR: [{ studentId: profile.id }, { userId: extra.id }] } });
  await db.studentProfile.delete({ where: { id: profile.id } });
  await db.user.delete({ where: { id: extra.id } });
  if (relatedSkillId) await db.skill.delete({ where: { id: relatedSkillId } });
 }
}

// Reuse the workflow's isolated fixtures, authenticated users and settings cleanup.
// Previously executing this file directly only defined a function and ran no checks.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 import("./e2e-workflow").then(({ runWorkflow }) => runWorkflow("security")).catch(error => { console.error(error); process.exitCode = 1; });
}
