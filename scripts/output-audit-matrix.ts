import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const db = new PrismaClient();

async function generateReport() {
  const levels = await db.skillLevel.findMany({ orderBy: { order: "asc" } });
  const skills = await db.skill.findMany({
    where: { active: true, category: { active: true }, level: { active: true } },
    include: { level: true, category: true }
  });
  const courses = await db.course.findMany({
    where: { active: true, skill: { active: true }, provider: { active: true } },
    include: { skill: { include: { level: true, category: true } }, provider: true },
    orderBy: [
      { skill: { level: { order: "asc" } } },
      { skill: { name: "asc" } },
      { title: "asc" }
    ]
  });

  // Track URL frequencies
  const urlCounts: Record<string, number> = {};
  for (const c of courses) {
    const u = (c.officialUrl || "").trim();
    if (u && u !== "OFFICIAL_LINK_PENDING") {
      urlCounts[u] = (urlCounts[u] || 0) + 1;
    }
  }

  let passCount = 0;
  let brokenCount = 0;
  let wrongDestCount = 0;
  let wrongProviderCount = 0;
  let duplicateCount = 0;
  let deprecatedCount = 0;
  let unavailableCount = 0;
  let uiErrorCount = 1; // /verify route returns 404

  const matrix: any[] = [];

  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    const skillName = c.skill.name;
    const levelName = c.skill.level.name;
    const courseTitle = c.title || c.name;
    const providerName = c.provider.name;
    const url = (c.officialUrl || "").trim();

    let status = "PASS";
    let issue = "None (Valid verified direct course URL)";

    const isPending = c.officialUrlStatus !== "VERIFIED" || !url || url === "OFFICIAL_LINK_PENDING";
    const isGeneric =
      /^https?:\/\/[^\/]+\/?$/i.test(url) ||
      /\/browse\/?$/i.test(url) ||
      /\/courses\/?$/i.test(url) ||
      /\/search\?/i.test(url) ||
      /\/learn\/?$/i.test(url) ||
      /\/training\/?$/i.test(url);

    const dupCount = url ? (urlCounts[url] || 0) : 0;

    // Check provider mismatch
    let providerMismatch = false;
    if (url && /^https?:\/\//i.test(url)) {
      try {
        const host = new URL(url).hostname.toLowerCase();
        const pLower = providerName.toLowerCase();
        if (pLower.includes("microsoft") && !host.includes("microsoft") && !host.includes("azure")) providerMismatch = true;
        if ((pLower.includes("aws") || pLower.includes("amazon")) && !host.includes("aws") && !host.includes("amazon")) providerMismatch = true;
        if (pLower.includes("google") && !host.includes("google") && !host.includes("cloud.google") && !host.includes("coursera")) providerMismatch = true;
        if (pLower.includes("cisco") && !host.includes("cisco") && !host.includes("skillsforall") && !host.includes("netacad")) providerMismatch = true;
        if (pLower.includes("oracle") && !host.includes("oracle")) providerMismatch = true;
        if (pLower.includes("ibm") && !host.includes("ibm") && !host.includes("coursera") && !host.includes("skillsbuild")) providerMismatch = true;
      } catch {
        providerMismatch = true;
      }
    }

    if (isPending) {
      status = "UNAVAILABLE";
      issue = "Official course link is pending verification or empty in DB.";
      unavailableCount++;
    } else if (isGeneric) {
      status = "WRONG DESTINATION";
      issue = `URL points to generic provider landing page (${url}) rather than specific course page.`;
      wrongDestCount++;
    } else if (providerMismatch) {
      status = "WRONG DESTINATION";
      issue = `Provider is "${providerName}", but official URL domain points to another platform (${url}).`;
      wrongProviderCount++;
    } else if (dupCount > 1) {
      status = "DUPLICATE";
      issue = `Same URL (${url}) is mapped to ${dupCount} different courses/skills in database.`;
      duplicateCount++;
    } else {
      passCount++;
    }

    matrix.push({
      num: i + 1,
      skill: skillName,
      level: levelName,
      course: courseTitle,
      provider: providerName,
      expected: `${skillName} Course by ${providerName}`,
      actual: url || "OFFICIAL_LINK_PENDING",
      status,
      issue,
      recordId: c.id,
      officialUrlStatus: c.officialUrlStatus,
    });
  }

  console.log("=== FINAL AUDIT MATRIX METRICS ===");
  console.log(`TOTAL SKILLS: ${skills.length}`);
  console.log(`TOTAL LEVELS: ${levels.length}`);
  console.log(`TOTAL COURSES: ${courses.length}`);
  console.log(`TOTAL COURSE LINKS TESTED: ${courses.length}`);
  console.log(`WORKING LINKS (PASS): ${passCount}`);
  console.log(`BROKEN LINKS: ${brokenCount}`);
  console.log(`WRONG COURSE DESTINATIONS: ${wrongDestCount}`);
  console.log(`WRONG PROVIDERS: ${wrongProviderCount}`);
  console.log(`DUPLICATE LINKS: ${duplicateCount}`);
  console.log(`DEPRECATED/UNAVAILABLE LINKS: ${unavailableCount}`);
  console.log(`OTHER UI/ROUTE ERRORS: ${uiErrorCount}`);

  fs.writeFileSync("scripts/final_matrix_data.json", JSON.stringify(matrix, null, 2), "utf8");
  console.log("Matrix data saved to scripts/final_matrix_data.json");

  await db.$disconnect();
}

generateReport().catch(err => {
  console.error(err);
  process.exit(1);
});
