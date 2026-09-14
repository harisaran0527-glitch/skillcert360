import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

async function main() {
  console.log("=== IDENTIFYING NEXT 50 COURSE CATALOGUE RECORDS TO AUDIT ===\n");

  // Load Phase 1, Phase 2, and Precision audit course IDs to exclude already audited ones
  const p1Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts"), "utf8");
  const p2Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const precScript = fs.readFileSync(path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts"), "utf8");

  const p1Ids = [...p1Script.matchAll(/id:\s*"([^"]+)"|courseId:\s*"([^"]+)"/g)].map(m => m[1] || m[2]);
  const p2Ids = [...p2Script.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  const precIds = [...precScript.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);

  const auditedIds = new Set([...p1Ids, ...p2Ids, ...precIds]);
  console.log(`Total previously audited unique course IDs: ${auditedIds.size}`);

  // Fetch all active courses from database
  const allCourses = await db.course.findMany({
    orderBy: { createdAt: "asc" },
    include: { provider: true, skill: true }
  });

  console.log(`Total courses in database: ${allCourses.length}`);

  // Filter for next batch of 50 courses
  // Prioritize courses that have URLs (or active=true) that haven't been in the audited set yet
  const nextBatch = allCourses.filter(c => !auditedIds.has(c.id)).slice(0, 50);

  console.log(`Found ${nextBatch.length} courses for the NEXT 50 audit batch.\n`);

  for (let i = 0; i < nextBatch.length; i++) {
    const c = nextBatch[i];
    console.log(`[${i + 1}/50] ID: ${c.id}`);
    console.log(`  Skill: ${c.skill.name} (${c.skill.levelId})`);
    console.log(`  Title: ${c.title}`);
    console.log(`  Provider: ${c.provider.name}`);
    console.log(`  UrlStatus: ${c.officialUrlStatus} | Active: ${c.active}`);
    console.log(`  URL: ${c.officialUrl}`);
    console.log("-".repeat(70));
  }

  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
