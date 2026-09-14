import fs from "fs";

interface CourseItem {
  courseId: string;
  skillId: string;
  skillName: string;
  level: string;
  category: string;
  currentTitle: string;
  currentProvider: string;
  currentStatus: string;
  currentUrl: string;
}

const items: CourseItem[] = JSON.parse(fs.readFileSync("scripts/retired_courses_list.json", "utf8"));

console.log(`Total items to process: ${items.length}`);

// Group by category and level
const grouped: Record<string, Record<string, CourseItem[]>> = {};

for (const item of items) {
  if (!grouped[item.category]) grouped[item.category] = {};
  if (!grouped[item.category][item.level]) grouped[item.category][item.level] = [];
  grouped[item.category][item.level].push(item);
}

for (const [cat, levels] of Object.entries(grouped)) {
  console.log(`\n=== CATEGORY: ${cat} ===`);
  for (const [lvl, list] of Object.entries(levels)) {
    console.log(`  Level ${lvl} (${list.length} skills):`);
    for (const item of list) {
      console.log(`    - [${item.skillName}] (Current course: "${item.currentTitle}")`);
    }
  }
}
