import { db } from "../src/lib/db";
import { productionNameWhere, productionSkillWhere } from "../src/lib/production-ui";

async function runTest() {
  const studentId = "cmu119csr0005lb04tndwexz1";
  const whereClause = { AND: [productionSkillWhere], active: true, category: { active: true }, level: { active: true } };

  const t0 = Date.now();
  await db.skillLevel.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { order: "asc" } });
  console.log(`q1 skillLevel: ${Date.now() - t0}ms`);

  const t1 = Date.now();
  await db.skillCategory.findMany({ where: { active: true, ...productionNameWhere }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  console.log(`q2 skillCategory: ${Date.now() - t1}ms`);

  const t2 = Date.now();
  await db.provider.findMany({ where: { active: true, ...productionNameWhere, slug: { not: null } }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  console.log(`q3 provider: ${Date.now() - t2}ms`);

  const t3 = Date.now();
  await db.skill.count({ where: whereClause });
  console.log(`q4 skill.count: ${Date.now() - t3}ms`);

  const t4 = Date.now();
  await db.skill.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: { select: { id: true, name: true } },
      level: { select: { id: true, name: true } },
      studentSkills: {
        where: { studentId },
        select: { id: true, completedAt: true },
      },
    },
    orderBy: [{ level: { order: "asc" } }, { name: "asc" }, { id: "asc" }],
    take: 24,
  });
  console.log(`q5 skill.findMany: ${Date.now() - t4}ms`);

  process.exit(0);
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
