import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();
const LEDGER_PATH = path.join(process.cwd(), "scripts/audit_ledger.json");

export interface LedgerEntry {
  courseId: string;
  verdict: "VERIFIED" | "CORRECTED" | "UNRESOLVED";
  firstAuditedBatch: string;
  lastAuditedBatch: string;
  auditCount: number;
  batchesAppeared: string[];
}

export interface AuditLedger {
  entries: Record<string, LedgerEntry>;
}

async function rebuildLedger() {
  console.log("======================================================================");
  console.log("=== REBUILDING AUDIT LEDGER FROM HISTORICAL AUDIT SCRIPT FILES ===");
  console.log("======================================================================\n");

  const p1Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts"), "utf8");
  const p2Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const precScript = fs.readFileSync(path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts"), "utf8");
  const b1Script = fs.readFileSync(path.join(process.cwd(), "scripts/audit-50-batch-read-only.ts"), "utf8");
  const b2Script = fs.readFileSync(path.join(process.cwd(), "scripts/audit-batch-50-next.ts"), "utf8");

  // Extract raw audit occurrences with batch names
  const rawEvents: Array<{ courseId: string; batch: string; defaultVerdict: "VERIFIED" | "CORRECTED" | "UNRESOLVED" }> = [];

  // Phase 1 (13 records)
  const p1Matches = [...p1Script.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  for (const id of p1Matches) {
    rawEvents.push({ courseId: id, batch: "Phase 1 (13 Bad Records)", defaultVerdict: "CORRECTED" });
  }

  // Phase 2 (89 records in FIXES)
  const p2Matches = [...p2Script.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  for (const id of p2Matches) {
    rawEvents.push({ courseId: id, batch: "Phase 2 (89 MS Browse Fixes)", defaultVerdict: "CORRECTED" });
  }

  // 23 Precision Batch (23 records)
  const precMatches = [...precScript.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
  // Look up verdicts in precScript
  for (const id of precMatches) {
    const isUnresolved = precScript.includes(`id: "${id}"`) && precScript.includes(`verdict: "UNRESOLVED"`);
    rawEvents.push({
      courseId: id,
      batch: "23-Record Precision Batch",
      defaultVerdict: isUnresolved ? "UNRESOLVED" : "CORRECTED"
    });
  }

  // Batch 1 (50-record series)
  const b1Matches = [...b1Script.matchAll(/Record #\d+ \[([^\]]+)\]/g)].map(m => m[1]);
  for (const id of b1Matches) {
    rawEvents.push({ courseId: id, batch: "Batch 1 (50-Series)", defaultVerdict: "VERIFIED" });
  }

  // Batch 2 (50-record series)
  const b2Matches = [...b2Script.matchAll(/Record #\d+ \[([^\]]+)\]/g)].map(m => m[1]);
  for (const id of b2Matches) {
    rawEvents.push({ courseId: id, batch: "Batch 2 (50-Series)", defaultVerdict: "VERIFIED" });
  }

  console.log(`Total raw historical audit entries found: ${rawEvents.length}`);

  // Deduplicate and build ledger
  const ledgerEntries: Record<string, LedgerEntry> = {};
  const occurrencesPerId = new Map<string, string[]>();

  for (const ev of rawEvents) {
    const batches = occurrencesPerId.get(ev.courseId) || [];
    batches.push(ev.batch);
    occurrencesPerId.set(ev.courseId, batches);

    if (!ledgerEntries[ev.courseId]) {
      ledgerEntries[ev.courseId] = {
        courseId: ev.courseId,
        verdict: ev.defaultVerdict,
        firstAuditedBatch: ev.batch,
        lastAuditedBatch: ev.batch,
        auditCount: 1,
        batchesAppeared: [ev.batch]
      };
    } else {
      ledgerEntries[ev.courseId].auditCount++;
      ledgerEntries[ev.courseId].lastAuditedBatch = ev.batch;
      if (!ledgerEntries[ev.courseId].batchesAppeared.includes(ev.batch)) {
        ledgerEntries[ev.courseId].batchesAppeared.push(ev.batch);
      }
    }
  }

  // Write rebuilt ledger to disk
  fs.writeFileSync(LEDGER_PATH, JSON.stringify({ entries: ledgerEntries }, null, 2), "utf8");

  // Analyze duplicates
  const duplicateIds: Array<{ id: string; count: number; batches: string[] }> = [];
  for (const [id, batches] of occurrencesPerId.entries()) {
    if (batches.length > 1) {
      duplicateIds.push({ id, count: batches.length, batches });
    }
  }

  const totalUniqueAuditedIds = Object.keys(ledgerEntries).length;

  // Query DB total records
  const totalCoursesInDb = await db.course.count();
  const trueRemainingUnaudited = totalCoursesInDb - totalUniqueAuditedIds;

  console.log("\n======================================================================");
  console.log("=== LEDGER INTEGRITY & DEDUPLICATION REPORT ===");
  console.log("======================================================================");
  console.log(`1. Raw historical audit entries        : ${rawEvents.length}`);
  console.log(`2. True UNIQUE Course IDs audited       : ${totalUniqueAuditedIds}`);
  console.log(`3. Duplicate/repeated Course IDs found  : ${duplicateIds.length}`);
  console.log(`4. How many IDs audited > 1 time       : ${duplicateIds.length}`);
  console.log(`5. Corrected cumulative audited count   : ${totalUniqueAuditedIds} / ${totalCoursesInDb}`);
  console.log(`6. True remaining unaudited records     : ${trueRemainingUnaudited}`);
  console.log("======================================================================\n");

  console.log("=== REPEATED / DUPLICATE COURSE IDs BREAKDOWN ===");
  duplicateIds.forEach((dup, idx) => {
    console.log(`${idx + 1}. [${dup.id}] Audited ${dup.count} times in: ${dup.batches.join(" -> ")}`);
  });

  // Verify Next 50 Selection candidate IDs from DB
  console.log("\n======================================================================");
  console.log("=== SELECTING NEXT 50 CANDIDATE IDs (STRICT LEDGER EXCLUSION) ===");
  console.log("======================================================================\n");

  const allCourses = await db.course.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, officialUrl: true, skill: { select: { name: true } }, provider: { select: { name: true } } }
  });

  const uniqueAuditedSet = new Set(Object.keys(ledgerEntries));
  const next50Candidates = allCourses.filter(c => !uniqueAuditedSet.has(c.id)).slice(0, 50);

  // Check overlap with ledger
  let overlapCount = 0;
  for (const cand of next50Candidates) {
    if (uniqueAuditedSet.has(cand.id)) {
      overlapCount++;
    }
  }

  console.log(`Overlap with existing ledger: ${overlapCount}`);

  if (overlapCount > 0) {
    console.error("❌ ABORTING: Overlap > 0 detected!");
    process.exit(1);
  }

  console.log("✓ Confirmation: overlap with ledger = 0\n");

  console.log("=== NEXT 50 CANDIDATE COURSE IDs (FIRST 20 SHOWN) ===");
  next50Candidates.slice(0, 20).forEach((cand, idx) => {
    console.log(`${idx + 1}. [${cand.id}] Skill: "${cand.skill.name}" | Provider: "${cand.provider.name}" | Title: "${cand.title}"`);
  });
  console.log(`... and ${next50Candidates.length - 20} more candidate IDs selected.`);

  await db.$disconnect();
}

rebuildLedger().catch(e => {
  console.error(e);
  process.exit(1);
});
