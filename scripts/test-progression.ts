/**
 * Automated progression tests for the 4-level unlock system.
 *
 * Tests 1–14 as specified in the task spec.
 * These are pure database / service-layer tests — no browser required.
 *
 * Run: npx.cmd tsx scripts/test-progression.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  getStudentProgression,
  assertSkillLevelUnlocked,
  UNLOCK_THRESHOLDS,
} from "../src/lib/progression";

const db = new PrismaClient();
const tag = "PROG-TEST-" + Date.now();
let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
    failures.push(label);
  }
}

async function assertThrows403(fn: () => Promise<unknown>, label: string) {
  try {
    await fn();
    check(label + " (should have thrown 403)", false);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    check(label, status === 403);
  }
}

async function assertNoThrow(fn: () => Promise<unknown>, label: string) {
  try {
    await fn();
    check(label, true);
  } catch {
    check(label + " (should not have thrown)", false);
  }
}

// ── Fixture setup ──────────────────────────────────────────────────────────────
async function setup() {
  // Ensure 4 canonical levels exist (upsert by name to avoid unique-order conflicts).
  const levelData = [
    { name: "Beginner", order: 1, passMark: 30 },
    { name: "Advanced", order: 2, passMark: 35 },
    { name: "Pro", order: 3, passMark: 38 },
    { name: "Expert", order: 4, passMark: 40 },
  ];
  const levels: Record<string, string> = {}; // name → id
  for (const l of levelData) {
    const existing = await db.skillLevel.findFirst({ where: { name: l.name } });
    if (existing) {
      levels[l.name] = existing.id;
    } else {
      // Try to find by order in case the name differs.
      const byOrder = await db.skillLevel.findFirst({ where: { order: l.order } });
      if (byOrder) {
        // Update the name to match canonical expectation.
        const updated = await db.skillLevel.update({ where: { id: byOrder.id }, data: { name: l.name } });
        levels[l.name] = updated.id;
      } else {
        const created = await db.skillLevel.create({ data: l });
        levels[l.name] = created.id;
      }
    }
  }

  // Create test fixtures under a unique tag.
  const dept = await db.department.create({ data: { name: tag } });
  const section = await db.section.create({ data: { name: "T1", departmentId: dept.id } });
  const category = await db.skillCategory.create({ data: { name: tag, slug: tag.toLowerCase() } });

  // One skill per level.
  const skillIds: Record<string, string> = {};
  for (const [levelName, levelId] of Object.entries(levels)) {
    const skill = await db.skill.create({
      data: {
        name: `${tag} ${levelName} Skill`,
        slug: `${tag.toLowerCase()}-${levelName.toLowerCase()}`,
        categoryId: category.id,
        levelId,
      },
    });
    skillIds[levelName] = skill.id;
  }

  return { dept, section, levels, skillIds, category };
}

// Create a fresh student profile for each test.
async function makeStudent(dept: { id: string }, section: { id: string }, label: string) {
  const email = `${tag.toLowerCase()}-${label}@example.test`;
  const user = await db.user.create({
    data: {
      email,
      passwordHash: "$2b$04$12345678901234567890123456789012345678901234567890123",
      role: "STUDENT",
    },
  });
  const profile = await db.studentProfile.create({
    data: {
      userId: user.id,
      fullName: `${tag} ${label}`,
      registerNumber: `${tag}-${label}`,
      departmentId: dept.id,
      sectionId: section.id,
      year: 1,
    },
  });
  return { userId: user.id, profileId: profile.id };
}

// Directly insert VERIFIED certificates for a given level skill and student.
// We bypass the workflow intentionally — tests need to simulate arbitrary counts.
async function insertVerifiedCerts(studentId: string, skillId: string, count: number) {
  for (let i = 0; i < count; i++) {
    // Each cert must be for the same skill. The schema has @@unique([studentId, skillId]).
    // So we instead create a sibling skill for each additional cert.
    // Actually: one cert per skill per student. We need distinct skills for >1 cert.
    // We'll rely on the caller to pass distinct skillIds.
    await db.certificate.upsert({
      where: { studentId_skillId: { studentId, skillId } },
      create: { studentId, skillId, status: "VERIFIED", verifiedAt: new Date() },
      update: { status: "VERIFIED", verifiedAt: new Date() },
    });
  }
}

// Helper: create `count` distinct skills at the given level, then mark all VERIFIED.
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const message = (err as { message?: string; code?: string }).message || "";
    const code = (err as { code?: string }).code || "";
    if (retries > 0 && (code === "P1017" || message.includes("closed the connection") || message.includes("Can't reach database"))) {
      await new Promise(r => setTimeout(r, 1000));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

async function giveVerifiedCerts(
  studentId: string,
  levelId: string,
  levelName: string,
  categoryId: string,
  count: number,
  label: string,
): Promise<string[]> {
  const skillData: any[] = [];
  const certData: any[] = [];
  const skillIds: string[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const id = randomUUID();
    skillIds.push(id);
    skillData.push({
      id,
      name: `${tag}-${label}-${levelName}-${i}-${randomUUID().slice(0, 8)}`,
      slug: `${tag.toLowerCase()}-${label}-${levelName.toLowerCase()}-${i}-${randomUUID().slice(0, 8)}`,
      categoryId,
      levelId,
    });
    certData.push({
      id: randomUUID(),
      studentId,
      skillId: id,
      status: "VERIFIED" as const,
      verifiedAt: now,
    });
  }

  if (skillData.length > 0) {
    await withRetry(() => db.skill.createMany({ data: skillData }));
    await withRetry(() => db.certificate.createMany({ data: certData }));
  }

  return skillIds;
}

async function deleteTestSkills(skillIds: string[]) {
  if (!skillIds || skillIds.length === 0) return;
  await withRetry(() => db.certificate.deleteMany({ where: { skillId: { in: skillIds } } }));
  await withRetry(() => db.skill.deleteMany({ where: { id: { in: skillIds } } }));
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
async function cleanup(deptId: string, categoryId: string) {
  // Delete all fixtures created for this run.
  const users = await db.user.findMany({ where: { email: { startsWith: tag.toLowerCase() } }, select: { id: true, studentProfile: { select: { id: true } } } });
  const profileIds = users.flatMap(u => u.studentProfile ? [u.studentProfile.id] : []);
  for (const pid of profileIds) {
    await db.activityLog.deleteMany({ where: { studentId: pid } });
    await db.certificate.deleteMany({ where: { studentId: pid } });
    await db.studentProfile.delete({ where: { id: pid } }).catch(() => null);
  }
  await db.user.deleteMany({ where: { email: { startsWith: tag.toLowerCase() } } });
  await db.skill.deleteMany({ where: { slug: { startsWith: tag.toLowerCase() } } });
  await db.skillCategory.delete({ where: { id: categoryId } }).catch(() => null);
  await db.section.deleteMany({ where: { departmentId: deptId } });
  await db.department.delete({ where: { id: deptId } }).catch(() => null);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n=== SkillCert 360 — Progression Tests ===\n");

  const { dept, section, levels, skillIds, category } = await setup();

  // ── Test 1: New student — Beginner unlocked, rest locked ─────────────────
  console.log("Test 1: New student baseline");
  {
    const { profileId } = await makeStudent(dept, section, "t1");
    const prog = await getStudentProgression(profileId);
    check("Beginner is unlocked", prog.levels.find(l => l.name === "Beginner")!.unlocked === true);
    check("Advanced is locked", prog.levels.find(l => l.name === "Advanced")!.unlocked === false);
    check("Pro is locked", prog.levels.find(l => l.name === "Pro")!.unlocked === false);
    check("Expert is locked", prog.levels.find(l => l.name === "Expert")!.unlocked === false);
  }

  // ── Test 2: 24 VERIFIED Beginner certs — Advanced still locked ────────────
  console.log("\nTest 2: 24 Beginner verified certs — Advanced still locked");
  {
    const { profileId } = await makeStudent(dept, section, "t2");
    const extraSkills = await giveVerifiedCerts(profileId, levels["Beginner"], "Beginner", category.id, 24, "t2");
    const prog = await getStudentProgression(profileId);
    check("Beginner verified count is 24", prog.levels.find(l => l.name === "Beginner")!.verifiedCount === 24);
    check("Advanced still locked at 24", prog.levels.find(l => l.name === "Advanced")!.unlocked === false);
    check("Remaining for Advanced is 1", prog.levels.find(l => l.name === "Advanced")!.remaining === 1);
    // Clean up extra skills.
    await deleteTestSkills(extraSkills);
  }

  // ── Test 3: Exactly 25 VERIFIED Beginner certs — Advanced unlocks ─────────
  console.log("\nTest 3: 25 Beginner verified certs — Advanced unlocks");
  {
    const { profileId } = await makeStudent(dept, section, "t3");
    const extraSkills = await giveVerifiedCerts(profileId, levels["Beginner"], "Beginner", category.id, 25, "t3");
    const prog = await getStudentProgression(profileId);
    check("Beginner verified count is 25", prog.levels.find(l => l.name === "Beginner")!.verifiedCount === 25);
    check("Advanced unlocked at 25", prog.levels.find(l => l.name === "Advanced")!.unlocked === true);
    check("Remaining for Advanced is 0", prog.levels.find(l => l.name === "Advanced")!.remaining === 0);
    await deleteTestSkills(extraSkills);
  }

  // ── Test 4: 49 VERIFIED Advanced certs — Pro locked ──────────────────────
  console.log("\nTest 4: 49 Advanced verified certs — Pro still locked");
  {
    const { profileId } = await makeStudent(dept, section, "t4");
    // Also need 25 Beginner so Advanced itself is unlocked (progression is independent per level gate).
    const begSkills = await giveVerifiedCerts(profileId, levels["Beginner"], "Beginner", category.id, 25, "t4b");
    const advSkills = await giveVerifiedCerts(profileId, levels["Advanced"], "Advanced", category.id, 49, "t4");
    const prog = await getStudentProgression(profileId);
    check("Advanced verified count is 49", prog.levels.find(l => l.name === "Advanced")!.verifiedCount === 49);
    check("Pro still locked at 49", prog.levels.find(l => l.name === "Pro")!.unlocked === false);
    check("Remaining for Pro is 1", prog.levels.find(l => l.name === "Pro")!.remaining === 1);
    await deleteTestSkills([...begSkills, ...advSkills]);
  }

  // ── Test 5: Exactly 50 VERIFIED Advanced certs — Pro unlocks ─────────────
  console.log("\nTest 5: 50 Advanced verified certs — Pro unlocks");
  {
    const { profileId } = await makeStudent(dept, section, "t5");
    const advSkills = await giveVerifiedCerts(profileId, levels["Advanced"], "Advanced", category.id, 50, "t5");
    const prog = await getStudentProgression(profileId);
    check("Advanced verified count is 50", prog.levels.find(l => l.name === "Advanced")!.verifiedCount === 50);
    check("Pro unlocked at 50", prog.levels.find(l => l.name === "Pro")!.unlocked === true);
    check("Remaining for Pro is 0", prog.levels.find(l => l.name === "Pro")!.remaining === 0);
    await deleteTestSkills(advSkills);
  }

  // ── Test 6: 74 VERIFIED Pro certs — Expert locked ─────────────────────────
  console.log("\nTest 6: 74 Pro verified certs — Expert still locked");
  {
    const { profileId } = await makeStudent(dept, section, "t6");
    const proSkills = await giveVerifiedCerts(profileId, levels["Pro"], "Pro", category.id, 74, "t6");
    const prog = await getStudentProgression(profileId);
    check("Pro verified count is 74", prog.levels.find(l => l.name === "Pro")!.verifiedCount === 74);
    check("Expert still locked at 74", prog.levels.find(l => l.name === "Expert")!.unlocked === false);
    check("Remaining for Expert is 1", prog.levels.find(l => l.name === "Expert")!.remaining === 1);
    await deleteTestSkills(proSkills);
  }

  // ── Test 7: Exactly 75 VERIFIED Pro certs — Expert unlocks ────────────────
  console.log("\nTest 7: 75 Pro verified certs — Expert unlocks");
  {
    const { profileId } = await makeStudent(dept, section, "t7");
    const proSkills = await giveVerifiedCerts(profileId, levels["Pro"], "Pro", category.id, 75, "t7");
    const prog = await getStudentProgression(profileId);
    check("Pro verified count is 75", prog.levels.find(l => l.name === "Pro")!.verifiedCount === 75);
    check("Expert unlocked at 75", prog.levels.find(l => l.name === "Expert")!.unlocked === true);
    check("Remaining for Expert is 0", prog.levels.find(l => l.name === "Expert")!.remaining === 0);
    await deleteTestSkills(proSkills);
  }

  // ── Test 8: Non-VERIFIED certs do NOT count ────────────────────────────────
  console.log("\nTest 8: Pending/rejected certs do not count toward progression");
  {
    const { profileId } = await makeStudent(dept, section, "t8");
    // Create 30 skills but mark them in non-VERIFIED statuses.
    const nonVerifiedStatuses = [
      "LOCKED", "UNLOCKED", "PENDING_SUBMISSION", "SUBMITTED",
      "PENDING_VERIFICATION", "REJECTED", "NEEDS_RESUBMISSION",
    ];
    const extraSkills: string[] = [];
    for (let i = 0; i < nonVerifiedStatuses.length; i++) {
      const sk = await db.skill.create({
        data: { name: `${tag}-t8-${i}`, slug: `${tag.toLowerCase()}-t8-${i}`, categoryId: category.id, levelId: levels["Beginner"] },
      });
      extraSkills.push(sk.id);
      await db.certificate.create({
        data: { studentId: profileId, skillId: sk.id, status: nonVerifiedStatuses[i] as Parameters<typeof db.certificate.create>[0]["data"]["status"] },
      });
    }
    const prog = await getStudentProgression(profileId);
    check("Beginner verified count is 0 (no VERIFIED certs)", prog.levels.find(l => l.name === "Beginner")!.verifiedCount === 0);
    check("Advanced still locked with only non-VERIFIED certs", prog.levels.find(l => l.name === "Advanced")!.unlocked === false);
    await deleteTestSkills(extraSkills);
  }

  // ── Test 9: Assessment pass alone does not count ──────────────────────────
  console.log("\nTest 9: Assessment pass without verified cert does not count");
  {
    const { profileId } = await makeStudent(dept, section, "t9");
    // Create a passed assessment attempt but no VERIFIED cert.
    await db.assessmentAttempt.create({
      data: {
        token: randomUUID(),
        studentId: profileId,
        skillId: skillIds["Beginner"],
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        submittedAt: new Date(),
        score: 30,
        passed: true,
        attemptNumber: 1,
        questionCount: 50,
        passMark: 30,
        violationLimit: 3,
        cooldownHours: 6,
      },
    });
    const prog = await getStudentProgression(profileId);
    check("Beginner verified count is 0 (only assessment pass, no cert)", prog.levels.find(l => l.name === "Beginner")!.verifiedCount === 0);
    check("Advanced still locked after assessment pass only", prog.levels.find(l => l.name === "Advanced")!.unlocked === false);
  }

  // ── Test 10: Direct API to locked level is rejected ───────────────────────
  console.log("\nTest 10: Direct assertSkillLevelUnlocked rejects locked level");
  {
    const { profileId } = await makeStudent(dept, section, "t10");
    // No Beginner certs → Advanced is locked.
    await assertThrows403(
      () => assertSkillLevelUnlocked(profileId, skillIds["Advanced"]),
      "assertSkillLevelUnlocked throws 403 for Advanced when locked",
    );
    // Beginner is always allowed.
    await assertNoThrow(
      () => assertSkillLevelUnlocked(profileId, skillIds["Beginner"]),
      "assertSkillLevelUnlocked does not throw for Beginner",
    );
  }

  // ── Test 11: Direct URL action blocked for locked level ───────────────────
  console.log("\nTest 11: Server-side guard rejects learning action for locked level");
  {
    const { profileId } = await makeStudent(dept, section, "t11");
    // Simulate: student has 0 Beginner certs. They try Advanced skill.
    await assertThrows403(
      () => assertSkillLevelUnlocked(profileId, skillIds["Advanced"]),
      "Learning action on Advanced blocked when locked (403)",
    );
    await assertThrows403(
      () => assertSkillLevelUnlocked(profileId, skillIds["Pro"]),
      "Learning action on Pro blocked when locked (403)",
    );
    await assertThrows403(
      () => assertSkillLevelUnlocked(profileId, skillIds["Expert"]),
      "Learning action on Expert blocked when locked (403)",
    );
  }

  // ── Test 12: Client-side manipulation cannot change progression ───────────
  console.log("\nTest 12: Progression is always derived server-side from DB records");
  {
    const { profileId } = await makeStudent(dept, section, "t12");
    // Progression is re-derived each call — there is no stored boolean to flip.
    const prog1 = await getStudentProgression(profileId);
    check("Advanced locked on first call", !prog1.levels.find(l => l.name === "Advanced")!.unlocked);
    // Calling again gives the same answer — no client value involved.
    const prog2 = await getStudentProgression(profileId);
    check("Advanced still locked on second call (no stored state to flip)", !prog2.levels.find(l => l.name === "Advanced")!.unlocked);
  }

  // ── Test 13: Admin verification immediately updates progression ────────────
  console.log("\nTest 13: Admin VERIFIED status immediately updates progression");
  {
    const { profileId } = await makeStudent(dept, section, "t13");
    // Start: 24 VERIFIED Beginner certs.
    const extraSkills = await giveVerifiedCerts(profileId, levels["Beginner"], "Beginner", category.id, 24, "t13");
    const before = await getStudentProgression(profileId);
    check("Advanced locked before 25th cert", !before.levels.find(l => l.name === "Advanced")!.unlocked);
    // Admin approves one more — add a 25th VERIFIED cert.
    const sk25 = await db.skill.create({
      data: { name: `${tag}-t13-25`, slug: `${tag.toLowerCase()}-t13-25`, categoryId: category.id, levelId: levels["Beginner"] },
    });
    extraSkills.push(sk25.id);
    await db.certificate.create({
      data: { studentId: profileId, skillId: sk25.id, status: "VERIFIED", verifiedAt: new Date() },
    });
    const after = await getStudentProgression(profileId);
    check("Advanced unlocked immediately after 25th VERIFIED cert", after.levels.find(l => l.name === "Advanced")!.unlocked === true);
    await deleteTestSkills(extraSkills);
  }

  // ── Test 14: Revoking VERIFIED status recalculates correctly ──────────────
  console.log("\nTest 14: Revoking VERIFIED status immediately recalculates progression");
  {
    const { profileId } = await makeStudent(dept, section, "t14");
    // Give exactly 25 VERIFIED Beginner certs.
    const extraSkills = await giveVerifiedCerts(profileId, levels["Beginner"], "Beginner", category.id, 25, "t14");
    const before = await getStudentProgression(profileId);
    check("Advanced unlocked with 25 certs", before.levels.find(l => l.name === "Advanced")!.unlocked === true);
    // Revoke one cert (set to REJECTED).
    const lastSkillId = extraSkills[extraSkills.length - 1];
    await db.certificate.update({
      where: { studentId_skillId: { studentId: profileId, skillId: lastSkillId } },
      data: { status: "REJECTED", verifiedAt: null },
    });
    const after = await getStudentProgression(profileId);
    check("Beginner verified count drops to 24 after revocation", after.levels.find(l => l.name === "Beginner")!.verifiedCount === 24);
    check("Advanced locked again after revocation", after.levels.find(l => l.name === "Advanced")!.unlocked === false);
    check("Remaining for Advanced is 1 after revocation", after.levels.find(l => l.name === "Advanced")!.remaining === 1);
    await deleteTestSkills(extraSkills);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n=== Results ===");
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failures.length) {
    console.error("\nFailed checks:");
    for (const f of failures) console.error("  • " + f);
  }

  await cleanup(dept.id, category.id);
  await db.$disconnect();

  if (failed > 0) {
    console.error("\n✗ Progression tests FAILED");
    process.exitCode = 1;
  } else {
    console.log("\n✓ All progression tests passed");
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
  db.$disconnect();
});
