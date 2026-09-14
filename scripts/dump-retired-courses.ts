import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const db = new PrismaClient();

async function main() {
  const retiredCourses = await db.course.findMany({
    where: {
      OR: [
        { officialUrlStatus: "RETIRED" },
        { officialUrlStatus: "OFFICIAL_LINK_PENDING" },
        { active: false },
      ],
    },
    include: {
      skill: {
        include: {
          level: true,
          category: true,
        },
      },
      provider: true,
    },
    orderBy: [
      { skill: { level: { order: "asc" } } },
      { skill: { category: { name: "asc" } } },
      { skill: { name: "asc" } },
    ],
  });

  console.log(`Total retired/pending course records: ${retiredCourses.length}`);

  const summary = retiredCourses.map(c => ({
    courseId: c.id,
    skillId: c.skill.id,
    skillName: c.skill.name,
    level: c.skill.level.name,
    category: c.skill.category.name,
    currentTitle: c.title,
    currentProvider: c.provider.name,
    currentStatus: c.officialUrlStatus,
    currentUrl: c.officialUrl,
  }));

  fs.writeFileSync("scripts/retired_courses_list.json", JSON.stringify(summary, null, 2));
  console.log("Wrote scripts/retired_courses_list.json");

  // Let's also count by Level and Category
  const byLevel: Record<string, number> = {};
  for (const item of summary) {
    byLevel[item.level] = (byLevel[item.level] || 0) + 1;
  }
  console.log("By Level:", byLevel);
}

main()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
