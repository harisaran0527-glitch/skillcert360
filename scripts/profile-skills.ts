import { db } from "../src/lib/db";
import { getSession } from "../src/lib/auth";
import { expireStudentAttempts } from "../src/lib/assessment";
import { getStudentProgression } from "../src/lib/progression";
import { productionNameWhere, productionSkillWhere, productionCourseWhere } from "../src/lib/production-ui";
import { availableCourseWhere } from "../src/lib/catalog";

async function profile() {
  const studentProfile = await db.studentProfile.findFirst({
    where: { user: { status: "ACTIVE" } },
    select: { id: true, userId: true },
  });

  if (!studentProfile) {
    console.error("No test student profile found");
    process.exit(1);
  }

  const studentId = studentProfile.id;
  const userId = studentProfile.userId;

  console.log("=== PROFILING /student/skills INDIVIDUAL OPERATIONS ===");

  // 1. User lookup
  const t0 = Date.now();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { status: true, role: true, mustChangePassword: true },
  });
  const msUser = Date.now() - t0;
  console.log(`1. Session/User DB query: ${msUser}ms`);

  // 2. Student profile lookup
  const t1 = Date.now();
  const profile = await db.studentProfile.findUnique({
    where: { userId },
    select: { id: true, departmentId: true, sectionId: true },
  });
  const msProfile = Date.now() - t1;
  console.log(`2. Student Profile DB query: ${msProfile}ms`);

  // 3. Expire attempts
  const t2 = Date.now();
  await expireStudentAttempts(studentId);
  const msExpire = Date.now() - t2;
  console.log(`3. Expire student attempts: ${msExpire}ms`);

  // 4. Levels query
  const t3 = Date.now();
  const levels = await db.skillLevel.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { order: "asc" } });
  const msLevels = Date.now() - t3;
  console.log(`4. Skill Levels query: ${msLevels}ms`);

  // 5. Categories query
  const t4 = Date.now();
  const categories = await db.skillCategory.findMany({ where: { active: true, ...productionNameWhere }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  const msCategories = Date.now() - t4;
  console.log(`5. Skill Categories query: ${msCategories}ms`);

  // 6. Providers query
  const t5 = Date.now();
  const providers = await db.provider.findMany({ where: { active: true, ...productionNameWhere, slug: { not: null } }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  const msProviders = Date.now() - t5;
  console.log(`6. Providers query: ${msProviders}ms`);

  // 7. Progression query
  const t6 = Date.now();
  const progression = await getStudentProgression(studentId);
  const msProgression = Date.now() - t6;
  console.log(`7. Student Progression query: ${msProgression}ms`);

  // 8. Skill count query
  const whereClause = { AND: [productionSkillWhere], active: true, category: { active: true }, level: { active: true } };
  const t7 = Date.now();
  const count = await db.skill.count({ where: whereClause });
  const msCount = Date.now() - t7;
  console.log(`8. Skill Count query: ${msCount}ms (count = ${count})`);

  // 9. Main skills query with _count
  const t8 = Date.now();
  const skillsWithCount = await db.skill.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: { select: { id: true, name: true } },
      level: { select: { id: true, name: true } },
      _count: { select: { courses: { where: availableCourseWhere } } },
      studentSkills: {
        where: { studentId },
        select: { id: true, completedAt: true },
      },
    },
    orderBy: [{ level: { order: "asc" } }, { name: "asc" }, { id: "asc" }],
    take: 24,
  });
  const msSkillsWithCount = Date.now() - t8;
  console.log(`9. Main Skills query (with _count): ${msSkillsWithCount}ms (returned ${skillsWithCount.length} rows)`);

  // 10. Main skills query WITHOUT _count + separate batched course count
  const t9 = Date.now();
  const skillsClean = await db.skill.findMany({
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
  const msSkillsClean = Date.now() - t9;
  console.log(`10. Main Skills query (WITHOUT _count): ${msSkillsClean}ms`);

  // Batched course count query
  const skillIds = skillsClean.map(s => s.id);
  const t10 = Date.now();
  const courseCounts = await db.course.groupBy({
    by: ["skillId"],
    where: { ...availableCourseWhere, skillId: { in: skillIds } },
    _count: { _all: true },
  });
  const msCourseCounts = Date.now() - t10;
  console.log(`11. Batched Course groupBy query: ${msCourseCounts}ms (returned ${courseCounts.length} groups)`);

  process.exit(0);
}

profile().catch(err => {
  console.error(err);
  process.exit(1);
});
