import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function inspectAllSkills() {
  const skills = await db.skill.findMany({
    include: {
      level: true,
      category: true,
      courses: {
        include: { provider: true },
      },
    },
    orderBy: [{ level: { order: "asc" } }, { category: { name: "asc" } }, { name: "asc" }],
  });

  console.log(`Total skills in database: ${skills.length}`);

  const unverifiedSkills: Array<{ id: string; name: string; level: string; category: string; courseId: string; courseName: string; provider: string }> = [];

  for (const s of skills) {
    for (const c of s.courses) {
      if (c.officialUrlStatus !== "VERIFIED" || c.officialUrl.includes("official-provider.org") || !c.active) {
        unverifiedSkills.push({
          id: s.id,
          name: s.name,
          level: s.level.name,
          category: s.category.name,
          courseId: c.id,
          courseName: c.name,
          provider: c.provider.name,
        });
      }
    }
  }

  console.log(`Total unverified/retired courses to map: ${unverifiedSkills.length}`);
  
  // Output list grouped by level and category
  const byLevel: Record<string, typeof unverifiedSkills> = {};
  for (const item of unverifiedSkills) {
    byLevel[item.level] = byLevel[item.level] || [];
    byLevel[item.level].push(item);
  }

  for (const [lvl, items] of Object.entries(byLevel)) {
    console.log(`\n=== LEVEL: ${lvl} (${items.length} unverified courses) ===`);
    for (const item of items.slice(0, 15)) {
      console.log(`  - [${item.category}] Skill: "${item.name}" | Current Course: "${item.courseName}"`);
    }
    if (items.length > 15) console.log(`  ... and ${items.length - 15} more`);
  }
}

inspectAllSkills()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
