import { db } from "../src/lib/db";

async function testDirectOrderSkillsQuery() {
  const studentId = "cmu119csr0005lb04tndwexz1";
  
  const fastWhere = {
    active: true,
    category: { active: true },
    level: { active: true },
  };

  console.log("=== TESTING DIRECT ORDERED SKILLS QUERY ===");

  const tStart = Date.now();

  const [totalCount, skills] = await Promise.all([
    db.skill.count({ where: fastWhere }),
    db.skill.findMany({
      where: fastWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        levelId: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
        studentSkills: {
          where: { studentId },
          select: { id: true, completedAt: true },
        },
      },
      orderBy: [{ levelId: "asc" }, { name: "asc" }],
      take: 24,
    }),
  ]);

  const duration = Date.now() - tStart;
  console.log(`DIRECT ORDER QUERY DURATION: ${duration}ms (returned ${skills.length} skills, total count ${totalCount})`);
  process.exit(0);
}

testDirectOrderSkillsQuery().catch(err => {
  console.error(err);
  process.exit(1);
});
