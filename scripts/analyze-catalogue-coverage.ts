import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function analyze() {
  const levels = await db.skillLevel.findMany({ orderBy: { order: "asc" } });

  console.log("=== CATALOGUE COVERAGE ANALYSIS ===");

  for (const lvl of levels) {
    const skills = await db.skill.findMany({
      where: { levelId: lvl.id, active: true },
      include: {
        courses: {
          where: { active: true },
        },
      },
    });

    let verifiedCourses = 0;
    let pendingCourses = 0;

    for (const s of skills) {
      for (const c of s.courses) {
        if (c.officialUrlStatus === "VERIFIED") verifiedCourses++;
        else if (c.officialUrlStatus === "OFFICIAL_LINK_PENDING") pendingCourses++;
      }
    }

    console.log(`\nLevel: ${lvl.name} (Order ${lvl.passMark}%)`);
    console.log(`  Total Active Skills: ${skills.length}`);
    console.log(`  Verified Courses: ${verifiedCourses}`);
    console.log(`  Pending Courses: ${pendingCourses}`);
  }
}

analyze()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
