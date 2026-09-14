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

// Output all 468 items in a clean format for dictionary building
console.log(`Exporting ${items.length} skills to mapping file...`);

const mappingTemplate = items.map(item => ({
  skillId: item.skillId,
  skillName: item.skillName,
  level: item.level,
  category: item.category,
  courseId: item.courseId,
  currentTitle: item.currentTitle,
  currentProvider: item.currentProvider,
}));

fs.writeFileSync("scripts/skills_to_map.json", JSON.stringify(mappingTemplate, null, 2));
console.log("Wrote scripts/skills_to_map.json");
