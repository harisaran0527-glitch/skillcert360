import { db } from "../src/lib/db";

async function findSkillsWithQuestions() {
  const questions = await db.question.findMany({
    where: { active: true },
    select: {
      skill: {
        select: {
          id: true,
          name: true,
          slug: true,
          level: { select: { name: true } },
          courses: {
            where: { active: true },
            select: { id: true, name: true, officialUrl: true, officialUrlStatus: true, provider: { select: { name: true } } },
          },
        },
      },
    },
  });

  const skillMap = new Map<string, { name: string; slug: string; level: string; count: number; courses: any[] }>();

  for (const q of questions) {
    const s = q.skill;
    if (!skillMap.has(s.id)) {
      skillMap.set(s.id, {
        name: s.name,
        slug: s.slug,
        level: s.level.name,
        count: 0,
        courses: s.courses,
      });
    }
    skillMap.get(s.id)!.count++;
  }

  console.log("Skills with active assessment questions:");
  for (const [id, info] of skillMap.entries()) {
    console.log(`\n- Skill: ${info.name} (${info.slug}) [Level: ${info.level}]`);
    console.log(`  Questions Count: ${info.count}`);
    console.log(`  Courses (${info.courses.length}):`);
    info.courses.forEach((c) => {
      console.log(`    * Course: ${c.name} | Provider: ${c.provider.name} | Status: ${c.officialUrlStatus} | URL: ${c.officialUrl}`);
    });
  }

  process.exit(0);
}

findSkillsWithQuestions().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
