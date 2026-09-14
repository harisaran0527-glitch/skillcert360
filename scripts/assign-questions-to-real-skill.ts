import { db } from "../src/lib/db";

async function assignQuestionsToRealSkill() {
  console.log("=== ATTACHING ASSESSMENT QUESTIONS TO REAL BEGINNER SKILL ===");

  // Find target real Beginner skill: Modern JavaScript (ES6+)
  const realSkill = await db.skill.findFirst({
    where: {
      slug: "modern-javascript-es6",
      active: true,
    },
    include: {
      level: true,
      courses: {
        include: { provider: true },
      },
    },
  });

  if (!realSkill) {
    console.error("Target real skill not found!");
    process.exit(1);
  }

  console.log(`Target Real Skill: ${realSkill.name} (${realSkill.id})`);
  console.log(`Level: ${realSkill.level.name}`);
  console.log(`Courses Count: ${realSkill.courses.length}`);
  realSkill.courses.forEach((c) => {
    console.log(`  - Course: ${c.name} | Provider: ${c.provider.name} | Status: ${c.officialUrlStatus} | URL: ${c.officialUrl}`);
  });

  // Find questions attached to test skills
  const testSkills = await db.skill.findMany({
    where: {
      OR: [
        { slug: { startsWith: "e2e-" } },
        { slug: { startsWith: "prog-test-" } },
        { name: { startsWith: "E2E-" } },
        { name: { startsWith: "PROG-TEST-" } },
      ],
    },
    select: { id: true, name: true },
  });

  const testSkillIds = testSkills.map((s) => s.id);
  console.log(`Found ${testSkillIds.length} test skills to reassign questions from.`);

  // Update questions to point to realSkill
  const updatedQuestions = await db.question.updateMany({
    where: {
      skillId: { in: testSkillIds },
    },
    data: {
      skillId: realSkill.id,
      levelId: realSkill.levelId,
    },
  });

  console.log(`Reassigned ${updatedQuestions.count} active assessment questions to real skill "${realSkill.name}".`);

  // Delete test skills, courses, and providers
  await db.$transaction(async (tx) => {
    const deletedCourses = await tx.course.deleteMany({
      where: {
        OR: [
          { skillId: { in: testSkillIds } },
          { name: { startsWith: "E2E-" } },
          { name: { startsWith: "PROG-TEST-" } },
        ],
      },
    });
    console.log(`Deleted ${deletedCourses.count} test courses.`);

    const deletedProviders = await tx.provider.deleteMany({
      where: {
        OR: [
          { name: { startsWith: "E2E-" } },
          { name: { startsWith: "PROG-TEST-" } },
          { slug: { startsWith: "e2e-" } },
          { slug: { startsWith: "prog-test-" } },
        ],
      },
    });
    console.log(`Deleted ${deletedProviders.count} test providers.`);

    const deletedSkills = await tx.skill.deleteMany({
      where: {
        id: { in: testSkillIds },
      },
    });
    console.log(`Deleted ${deletedSkills.count} test skills.`);
  });

  // Verify real skill question count
  const questionCount = await db.question.count({
    where: { skillId: realSkill.id, active: true },
  });
  console.log(`\nVerification: Real Skill "${realSkill.name}" now has ${questionCount} active assessment questions!`);

  process.exit(0);
}

assignQuestionsToRealSkill().catch((err) => {
  console.error("Assignment failed:", err);
  process.exit(1);
});
