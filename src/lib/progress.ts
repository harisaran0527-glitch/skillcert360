import { db } from "@/lib/db";

export type StudentProgressState = string;

export async function getSkillProgressState(studentId: string, skillId: string) {
  const [entry, attempt, certificate] = await Promise.all([
    db.studentSkill.findUnique({ where: { studentId_skillId: { studentId, skillId } } }),
    db.assessmentAttempt.findFirst({ where: { studentId, skillId }, orderBy: { startedAt: "desc" } }),
    db.certificate.findUnique({ where: { studentId_skillId: { studentId, skillId } } }),
  ]);
  if (certificate?.status === "VERIFIED" && attempt?.passed) return "VERIFIED";
  if (certificate && attempt?.passed) return certificate.status === "UNLOCKED" ? "CERTIFICATE_UNLOCKED" : certificate.status;
  if (attempt?.passed) return "ASSESSMENT_PASSED";
  if (attempt?.passed === false) return "REEXAM_REQUIRED";
  if (attempt && !attempt.submittedAt) return "ASSESSMENT_IN_PROGRESS";
  if (entry?.completedAt) return "ASSESSMENT_AVAILABLE";
  return entry ? "LEARNING" : "NOT_STARTED";
}

export async function getSkillProgressSummary(studentId: string) {
  const [skills, studentSkills, attempts, certificates] = await Promise.all([
    db.skill.findMany({ select: { id: true, name: true } }),
    db.studentSkill.findMany({ where: { studentId } }),
    db.assessmentAttempt.findMany({
      where: { studentId },
      orderBy: { startedAt: "desc" },
    }),
    db.certificate.findMany({ where: { studentId } }),
  ]);

  const skillMap = new Map(studentSkills.map((s) => [s.skillId, s]));
  const certMap = new Map(certificates.map((c) => [c.skillId, c]));
  
  // Latest attempt per skill
  const attemptMap = new Map<string, (typeof attempts)[0]>();
  for (const a of attempts) {
    if (!attemptMap.has(a.skillId)) {
      attemptMap.set(a.skillId, a);
    }
  }

  return skills.map((skill) => {
    const entry = skillMap.get(skill.id);
    const attempt = attemptMap.get(skill.id);
    const certificate = certMap.get(skill.id);

    let state = "NOT_STARTED";
    if (certificate?.status === "VERIFIED" && attempt?.passed) {
      state = "VERIFIED";
    } else if (certificate && attempt?.passed) {
      state = certificate.status === "UNLOCKED" ? "CERTIFICATE_UNLOCKED" : certificate.status;
    } else if (attempt?.passed) {
      state = "ASSESSMENT_PASSED";
    } else if (attempt?.passed === false) {
      state = "REEXAM_REQUIRED";
    } else if (attempt && !attempt.submittedAt) {
      state = "ASSESSMENT_IN_PROGRESS";
    } else if (entry?.completedAt) {
      state = "ASSESSMENT_AVAILABLE";
    } else if (entry) {
      state = "LEARNING";
    }

    return {
      skillId: skill.id,
      skillName: skill.name,
      state,
      started: state !== "NOT_STARTED",
      completed: ["ASSESSMENT_PASSED", "CERTIFICATE_UNLOCKED", "VERIFIED"].includes(state),
    };
  });
}
