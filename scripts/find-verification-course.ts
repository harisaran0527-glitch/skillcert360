import { db } from "../src/lib/db";
import { getAssessmentSettings } from "../src/lib/settings";

async function findVerificationCourse() {
  const settings = await getAssessmentSettings();
  console.log(`Assessment question count setting: ${settings.questionCount}`);

  const skills = await db.skill.findMany({
    where: {
      active: true,
      level: { name: "Beginner" },
      courses: {
        some: {
          active: true,
          officialUrlStatus: "VERIFIED",
        },
      },
    },
    include: {
      level: true,
      courses: {
        where: {
          active: true,
          officialUrlStatus: "VERIFIED",
        },
        include: {
          provider: true,
        },
      },
      questions: {
        where: {
          active: true,
          type: { in: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"] },
        },
      },
    },
  });

  console.log(`Found ${skills.length} Beginner skills with VERIFIED official course links.`);

  for (const skill of skills) {
    console.log(`\nSkill: ${skill.name} (${skill.slug})`);
    console.log(`  - Active Gradable Questions: ${skill.questions.length}`);
    console.log(`  - VERIFIED Courses:`);
    skill.courses.forEach((c) => {
      console.log(`     * Course: ${c.name} | Provider: ${c.provider.name} | URL: ${c.officialUrl}`);
    });
  }

  process.exit(0);
}

findVerificationCourse().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
