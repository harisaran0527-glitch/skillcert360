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
 const skills = await db.skill.findMany();
 return Promise.all(skills.map(async skill => {
  const state = await getSkillProgressState(studentId, skill.id);
  return { skillId: skill.id, skillName: skill.name, state, started: state !== "NOT_STARTED", completed: ["ASSESSMENT_PASSED", "CERTIFICATE_UNLOCKED", "VERIFIED"].includes(state) };
 }));
}
