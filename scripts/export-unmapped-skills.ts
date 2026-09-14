import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function exportSkills() {
  const skills = await db.skill.findMany({
    include: {
      level: true,
      category: true,
      courses: {
        include: { provider: true },
      },
    },
    orderBy: [{ level: { order: "asc" } }, { name: "asc" }],
  });

  console.log(`Total skills: ${skills.length}`);
  const list = skills.map(s => ({
    skillId: s.id,
    skillName: s.name,
    level: s.level.name,
    category: s.category.name,
    courseId: s.courses[0]?.id,
    courseTitle: s.courses[0]?.title || s.courses[0]?.name,
    provider: s.courses[0]?.provider?.name,
    status: s.courses[0]?.officialUrlStatus,
    url: s.courses[0]?.officialUrl,
    active: s.courses[0]?.active,
  }));

  console.log(JSON.stringify(list, null, 2));
}

exportSkills()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
