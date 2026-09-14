import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { loadLedger } from "./manage-audit-ledger";

const db = new PrismaClient();

async function prepareNextBatch50() {
  const ledger = loadLedger();
  const auditedSet = new Set(Object.keys(ledger.entries));

  const allCourses = await db.course.findMany({
    orderBy: { createdAt: "asc" },
    include: { provider: true, skill: true }
  });

  const totalCatalogueRecords = allCourses.length;
  const candidate50 = allCourses.filter(c => !auditedSet.has(c.id)).slice(0, 50);

  // Overlap verification safeguard
  let overlapCount = 0;
  for (const c of candidate50) {
    if (auditedSet.has(c.id)) {
      overlapCount++;
    }
  }

  console.log(`\n======================================================================`);
  console.log(`=== BATCH CANDIDATE SELECTION SAFEGUARD CHECK ===`);
  console.log(`======================================================================`);
  console.log(`Overlap with existing ledger: ${overlapCount}`);

  if (overlapCount > 0) {
    console.error("❌ OVERLAP DETECTED! ABORTING SCRIPT EXECUTION.");
    process.exit(1);
  }

  console.log("✓ Confirmation: overlap with ledger = 0\n");

  console.log(`Total catalogue records                  : ${totalCatalogueRecords}`);
  console.log(`Unique audited records in ledger         : ${auditedSet.size}`);
  console.log(`True remaining unaudited records         : ${totalCatalogueRecords - auditedSet.size}`);
  console.log(`Selected next 50 candidate records       : ${candidate50.length}\n`);

  console.log("=== NEXT 50 CANDIDATE RECORDS LIST ===");
  candidate50.forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.id}] Skill: "${c.skill.name}" (${c.skill.levelId}) | Provider: "${c.provider.name}" | Title: "${c.title}"`);
  });

  await db.$disconnect();
}

prepareNextBatch50().catch(e => {
  console.error(e);
  process.exit(1);
});
