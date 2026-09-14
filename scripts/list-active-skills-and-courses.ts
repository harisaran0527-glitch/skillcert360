import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function listSkills() {
  const skills = await db.skill.findMany({
    where: { active: true },
    include: {
      level: true,
      category: true,
      courses: {
        where: { active: true },
        include: { provider: true },
      },
    },
    orderBy: [{ level: { order: "asc" } }, { name: "asc" }],
  });

  console.log(`=== ACTIVE SKILLS IN DATABASE: ${skills.length} ===\n`);

  for (const s of skills) {
    console.log(`[${s.level.name}] ${s.name} (${s.category.name}) -> ${s.courses.length} courses`);
    for (const c of s.courses) {
      console.log(`   - Course ID: ${c.id} | Title: "${c.name}" | Provider: ${c.provider.name} | Status: ${c.officialUrlStatus} | URL: ${c.officialUrl}`);
    }
  }
}

listSkills()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
