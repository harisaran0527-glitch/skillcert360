import { db } from "../src/lib/db";

async function checkAllQuestions() {
  const questions = await db.question.findMany({
    where: { active: true },
    include: {
      skill: {
        include: {
          level: true,
          courses: {
            include: { provider: true },
          },
        },
      },
    },
  });

  console.log(`Total Active Questions in DB: ${questions.length}`);

  const skillCounts = new Map<string, { name: string; level: string; count: number; courses: any[] }>();

  for (const q of questions) {
    const s = q.skill;
    if (!skillCounts.has(s.id)) {
      skillCounts.set(s.id, {
        name: s.name,
        level: s.level.name,
        count: 0,
        courses: s.courses,
      });
    }
    skillCounts.get(s.id)!.count++;
  }

  console.log("\nSkill Breakdown:");
  for (const [id, data] of skillCounts.entries()) {
    console.log(`- ID: ${id} | Name: ${data.name} | Level: ${data.level} | Questions: ${data.count}`);
    data.courses.forEach((c) => {
      console.log(`   * Course: ${c.name} | Provider: ${c.provider.name} | Status: ${c.officialUrlStatus} | URL: ${c.officialUrl}`);
    });
  }

  process.exit(0);
}

checkAllQuestions().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
