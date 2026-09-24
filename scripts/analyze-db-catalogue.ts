import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const db = new PrismaClient();

async function main() {
  const levels = await db.skillLevel.findMany({ orderBy: { order: "asc" } });
  const categories = await db.skillCategory.findMany({ where: { active: true } });
  const providers = await db.provider.findMany({ where: { active: true } });
  const skills = await db.skill.findMany({
    where: { active: true, category: { active: true }, level: { active: true } },
    include: { level: true, category: true, courses: { where: { active: true } } }
  });
  const courses = await db.course.findMany({
    where: { active: true, skill: { active: true }, provider: { active: true } },
    include: { skill: { include: { level: true, category: true } }, provider: true }
  });

  console.log("=== DB CATALOGUE METRICS ===");
  console.log(`TOTAL LEVELS: ${levels.length}`);
  console.log(`TOTAL CATEGORIES: ${categories.length}`);
  console.log(`TOTAL PROVIDERS: ${providers.length}`);
  console.log(`TOTAL SKILLS: ${skills.length}`);
  console.log(`TOTAL ACTIVE COURSES: ${courses.length}`);

  // Breakdown by Level
  const levelBreakdown: Record<string, { skillsCount: number; coursesCount: number }> = {};
  for (const l of levels) {
    const lSkills = skills.filter(s => s.level.id === l.id);
    const lCourses = courses.filter(c => c.skill.level.id === l.id);
    levelBreakdown[l.name] = { skillsCount: lSkills.length, coursesCount: lCourses.length };
  }

  // Duplicate URL analysis
  const urlMap: Record<string, any[]> = {};
  for (const c of courses) {
    const url = (c.officialUrl || "").trim();
    if (url && url !== "OFFICIAL_LINK_PENDING") {
      if (!urlMap[url]) urlMap[url] = [];
      urlMap[url].push({
        id: c.id,
        skill: c.skill.name,
        level: c.skill.level.name,
        provider: c.provider.name,
        title: c.title || c.name,
      });
    }
  }

  const duplicates = Object.entries(urlMap).filter(([_, items]) => items.length > 1);

  // Mismatch provider check
  const mismatches: any[] = [];
  for (const c of courses) {
    const url = (c.officialUrl || "").trim();
    const pName = (c.provider.name || "").toLowerCase();
    let isMismatch = false;

    if (url && /^https?:\/\//i.test(url)) {
      try {
        const host = new URL(url).hostname.toLowerCase();
        if (pName.includes("microsoft") && !host.includes("microsoft") && !host.includes("azure")) isMismatch = true;
        if ((pName.includes("aws") || pName.includes("amazon")) && !host.includes("aws") && !host.includes("amazon")) isMismatch = true;
        if (pName.includes("google") && !host.includes("google") && !host.includes("cloud.google") && !host.includes("coursera")) isMismatch = true;
        if (pName.includes("cisco") && !host.includes("cisco") && !host.includes("skillsforall") && !host.includes("netacad")) isMismatch = true;
        if (pName.includes("oracle") && !host.includes("oracle")) isMismatch = true;
        if (pName.includes("ibm") && !host.includes("ibm") && !host.includes("coursera") && !host.includes("skillsbuild")) isMismatch = true;
      } catch {
        isMismatch = true;
      }
    }

    if (isMismatch) {
      mismatches.push({
        id: c.id,
        skill: c.skill.name,
        level: c.skill.level.name,
        provider: c.provider.name,
        title: c.title || c.name,
        url,
      });
    }
  }

  // Generic index / search page check
  const genericIndexPages: any[] = [];
  for (const c of courses) {
    const url = (c.officialUrl || "").trim();
    const isGeneric =
      /^https?:\/\/[^\/]+\/?$/i.test(url) ||
      /\/browse\/?$/i.test(url) ||
      /\/courses\/?$/i.test(url) ||
      /\/search\?/i.test(url) ||
      /\/learn\/?$/i.test(url) ||
      /\/training\/?$/i.test(url);

    if (isGeneric) {
      genericIndexPages.push({
        id: c.id,
        skill: c.skill.name,
        level: c.skill.level.name,
        provider: c.provider.name,
        title: c.title || c.name,
        url,
      });
    }
  }

  const analysisReport = {
    generatedAt: new Date().toISOString(),
    metrics: {
      totalLevels: levels.length,
      totalCategories: categories.length,
      totalProviders: providers.length,
      totalSkills: skills.length,
      totalActiveCourses: courses.length,
      duplicateUrlCount: duplicates.length,
      providerMismatchCount: mismatches.length,
      genericIndexPageCount: genericIndexPages.length,
    },
    levelBreakdown,
    duplicates: duplicates.map(([url, items]) => ({ url, count: items.length, sampleCourses: items })),
    mismatches,
    genericIndexPages,
  };

  fs.writeFileSync("scripts/db_catalogue_analysis.json", JSON.stringify(analysisReport, null, 2), "utf8");
  console.log("Analysis saved to scripts/db_catalogue_analysis.json");

  await db.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
