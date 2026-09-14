import { db } from "../src/lib/db";
import { getAssessmentSettings } from "../src/lib/settings";

async function auditQuestions() {
  console.log("=== AUDITING ASSESSMENT QUESTION CONTENT FOR SKILLS ===");

  const settings = await getAssessmentSettings();
  const requiredCount = settings.questionCount;

  const skills = await db.skill.findMany({
    where: { active: true },
    include: {
      level: true,
      category: true,
      _count: {
        select: {
          questions: {
            where: {
              active: true,
              type: { in: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"] },
            },
          },
        },
      },
    },
    orderBy: [{ level: { order: "asc" } }, { name: "asc" }],
  });

  const skillsWithEnough: { id: string; name: string; level: string; count: number }[] = [];
  const skillsLacking: { id: string; name: string; level: string; count: number; missing: number }[] = [];

  for (const skill of skills) {
    const qCount = skill._count.questions;
    if (qCount >= requiredCount) {
      skillsWithEnough.push({ id: skill.id, name: skill.name, level: skill.level.name, count: qCount });
    } else {
      skillsLacking.push({
        id: skill.id,
        name: skill.name,
        level: skill.level.name,
        count: qCount,
        missing: requiredCount - qCount,
      });
    }
  }

  console.log(`\nGlobal Config Question Target: ${requiredCount} questions per assessment`);
  console.log(`Skills with sufficient active questions (>= ${requiredCount}): ${skillsWithEnough.length}`);
  console.log(`Skills LACKING assessment questions (< ${requiredCount}): ${skillsLacking.length}\n`);

  if (skillsLacking.length > 0) {
    console.log("Detailed list of skills lacking questions:");
    skillsLacking.forEach((s) => {
      console.log(`  - [${s.level}] ${s.name} (${s.id}): ${s.count}/${requiredCount} questions (Lacks ${s.missing})`);
    });
  }

  process.exit(0);
}

auditQuestions().catch((err) => {
  console.error("Audit questions failed:", err);
  process.exit(1);
});
