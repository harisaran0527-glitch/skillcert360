import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const db = new PrismaClient();

export interface CompletedEvidenceEntry {
  courseId: string;
  source: string;
  verdict: "VERIFIED" | "CORRECTED" | "UNRESOLVED";
  evidenceText: string;
  evidenceType: "completed-report" | "completed-log" | "applied-correction";
}

export interface CandidateOnlyEvidenceEntry {
  courseId: string;
  source: string;
  evidenceText: string;
  reason: string;
}

const COMPLETED_EVIDENCE_PATH = path.join(process.cwd(), "scripts/audit_completed_evidence.json");
const CANDIDATE_ONLY_EVIDENCE_PATH = path.join(process.cwd(), "scripts/audit_candidate_only_evidence.json");
const LEDGER_IDS_PATH = path.join(process.cwd(), "scripts/audit_ledger_ids.json");
const LEDGER_JSON_PATH = path.join(process.cwd(), "scripts/audit_ledger.json");

const MANDATORY_KNOWN_IDS = [
  "cmtz8kt2b007rwubkul3yaf8s", // Docker Containerization Essentials
  "cmtz8kt2b007twubkpxb69tfr", // Kubernetes Core Concepts
  "cmtz8kt2b007xwubkc5mk6cu2", // Cybersecurity Fundamentals
  "cmtz8kt2b0081wubk2hgpx9be", // Information Security Policies
  "cmtz8kt2b0084wubkm8f058d0", // Wireless Network Security
  "cmtz8kt2b008mwubkmw5fvmtw", // Browser Automation with Playwright
  "cmtz8kt2b008pwubkt0hzh852", // Effective Team Communication
  "cmtz8kt2b0082wubkod0ymp4k"  // Firewall & Network Defense
];

async function main() {
  console.log("======================================================================");
  console.log("=== AUTHORITATIVE SEMANTIC AUDIT EVIDENCE REBUILD ===");
  console.log("======================================================================\n");

  const completedEntries: CompletedEvidenceEntry[] = [];
  const candidateOnlyEntries: CandidateOnlyEvidenceEntry[] = [];

  const allCoursesDb = await db.course.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, title: true, officialUrl: true, skill: { select: { name: true } }, provider: { select: { name: true } } }
  });

  const totalDbCourseCount = allCoursesDb.length;

  // 1. Phase 1 Script (13 Applied Corrections)
  const p1File = fs.readFileSync(path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts"), "utf8");
  const p1Matches = [...p1File.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  for (const id of p1Matches) {
    completedEntries.push({
      courseId: id,
      source: "Phase 1 Audit Batch",
      verdict: "CORRECTED",
      evidenceText: `Phase 1 applied fix in fix-bad-records-phase1.ts for ${id}`,
      evidenceType: "applied-correction"
    });
  }

  // 2. Phase 2 Script (89 Applied Corrections + 19 Unresolved Original MS Browse Records)
  const p2File = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const p2FixIds = [...p2File.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  for (const id of p2FixIds) {
    completedEntries.push({
      courseId: id,
      source: "Phase 2 Audit Batch",
      verdict: "CORRECTED",
      evidenceText: `Phase 2 applied fix in fix-ms-browse-records-phase2.ts for ${id}`,
      evidenceType: "applied-correction"
    });
  }

  const msBrowseCourses = allCoursesDb.filter(c => c.officialUrl === "https://learn.microsoft.com/en-us/training/browse/" || p2FixIds.includes(c.id));
  for (const c of msBrowseCourses) {
    if (!p2FixIds.includes(c.id)) {
      completedEntries.push({
        courseId: c.id,
        source: "Phase 2 Unresolved Batch",
        verdict: "UNRESOLVED",
        evidenceText: `Original MS Browse record ${c.id} logged as UNRESOLVED in Phase 2 audit`,
        evidenceType: "completed-report"
      });
    }
  }

  // 3. 23 Precision Batch Script & Output
  const precFile = fs.readFileSync(path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts"), "utf8");
  const precMatches = [...precFile.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
  for (const id of precMatches) {
    const isUnresolved = precFile.includes(`id: "${id}"`) && precFile.includes(`verdict: "UNRESOLVED"`);
    completedEntries.push({
      courseId: id,
      source: "23-Record Precision Audit Batch",
      verdict: isUnresolved ? "UNRESOLVED" : "CORRECTED",
      evidenceText: `23 Precision Batch record ${id} classified as ${isUnresolved ? "UNRESOLVED" : "CORRECTED"}`,
      evidenceType: "completed-report"
    });
  }

  // 4. Batch 1 Applied Corrections Script (14 records)
  const b1CorrFile = fs.readFileSync(path.join(process.cwd(), "scripts/apply-50-batch-corrections.ts"), "utf8");
  const b1CorrIds = [...b1CorrFile.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
  for (const id of b1CorrIds) {
    completedEntries.push({
      courseId: id,
      source: "Batch 1 Corrections (Applied)",
      verdict: "CORRECTED",
      evidenceText: `Batch 1 applied correction in apply-50-batch-corrections.ts for ${id}`,
      evidenceType: "applied-correction"
    });
  }

  // 5. Parse ALL task log files in .system_generated/tasks/ for explicit report blocks with VERDICT
  const tasksDir = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\tasks";
  if (fs.existsSync(tasksDir)) {
    const taskFiles = fs.readdirSync(tasksDir);
    for (const tf of taskFiles) {
      if (tf.endsWith(".log")) {
        const logContent = fs.readFileSync(path.join(tasksDir, tf), "utf8");
        const lines = logContent.split("\n");
        let currentRecordId: string | null = null;
        let currentRecordSkill = "";

        for (const line of lines) {
          const idMatch = line.match(/(?:Record|\[)\s*#?\d*\s*\[?(cmtz[a-z0-9]{21})\]?/);
          if (idMatch) {
            currentRecordId = idMatch[1];
          }

          if (line.includes("VERDICT") || line.includes("✓ Applied") || line.includes("Applied [")) {
            const matches = [...line.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0]);
            const targetId = currentRecordId || matches[0];

            if (targetId) {
              let verdict: "VERIFIED" | "CORRECTED" | "UNRESOLVED" = "VERIFIED";
              if (line.includes("NEEDS_CORRECTION") || line.includes("Applied")) verdict = "CORRECTED";
              if (line.includes("UNRESOLVED")) verdict = "UNRESOLVED";

              completedEntries.push({
                courseId: targetId,
                source: `Completed Task Log ${tf}`,
                verdict,
                evidenceText: line.trim(),
                evidenceType: "completed-log"
              });
            }
          }
        }
      }
    }
  }

  // 6. Parse FULL TRANSCRIPT JSONL line by line for explicit report blocks with VERDICT
  const transcriptPath = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\logs\\transcript_full.jsonl";
  if (fs.existsSync(transcriptPath)) {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let currentIdInTranscript: string | null = null;

    for await (const line of rl) {
      if (!line.trim()) continue;

      const isCandidatePreview = line.includes("NEXT 50 CANDIDATE COURSE IDs") || line.includes("CANDIDATE SELECTION") || line.includes("Candidate preview");
      const idMatches = [...line.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0]);

      if (isCandidatePreview) {
        for (const cid of idMatches) {
          // Push candidate preview entries for candidate logging, but we filter final list below
          candidateOnlyEntries.push({
            courseId: cid,
            source: "Transcript Candidate Preview",
            evidenceText: line.slice(0, 120),
            reason: "Appeared in candidate preview or selection output before audit"
          });
        }
      } else if (line.includes("VERDICT") || line.includes("✓ Applied") || line.includes("Applied [") || line.includes("Audit Report")) {
        for (const cid of idMatches) {
          let verdict: "VERIFIED" | "CORRECTED" | "UNRESOLVED" = "VERIFIED";
          if (line.includes("NEEDS_CORRECTION") || line.includes("Applied") || line.includes("CORRECTED")) verdict = "CORRECTED";
          if (line.includes("UNRESOLVED")) verdict = "UNRESOLVED";

          completedEntries.push({
            courseId: cid,
            source: "Transcript Completed Audit Report",
            verdict,
            evidenceText: line.slice(0, 150),
            evidenceType: "completed-report"
          });
        }
      }
    }
  }

  // Derive COMPLETED AUDIT LEDGER IDs (UNIQUE courseIds from completedEntries)
  const completedUniqueIdsSet = new Set(completedEntries.map(e => e.courseId));
  const sortedCompletedUniqueIds = Array.from(completedUniqueIdsSet).sort();

  // Filter candidateOnlyEntries so it contains ONLY records for courseIds that NEVER received a completed audit verdict
  const candidateOnlyFiltered = candidateOnlyEntries.filter(e => !completedUniqueIdsSet.has(e.courseId));

  // Populate additional candidateOnlyEntries for any ID in transcript/logs that is NOT in completedUniqueIdsSet
  const allTranscriptLogMatches = new Set<string>();
  if (fs.existsSync(transcriptPath)) {
    const content = fs.readFileSync(transcriptPath, "utf8");
    const matches = [...content.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0]);
    for (const m of matches) allTranscriptLogMatches.add(m);
  }

  const addedCandidateOnlyIds = new Set(candidateOnlyFiltered.map(e => e.courseId));
  for (const cid of allTranscriptLogMatches) {
    if (!completedUniqueIdsSet.has(cid) && !addedCandidateOnlyIds.has(cid)) {
      candidateOnlyFiltered.push({
        courseId: cid,
        source: "Candidate Preview / Debug Listing",
        evidenceText: `Course ID ${cid} appeared in candidate preview or debug query output`,
        reason: "Excluded from completed ledger because it never received an explicit completed audit verdict."
      });
      addedCandidateOnlyIds.add(cid);
    }
  }

  // Write scripts/audit_completed_evidence.json
  fs.writeFileSync(COMPLETED_EVIDENCE_PATH, JSON.stringify(completedEntries, null, 2), "utf8");

  // Write scripts/audit_candidate_only_evidence.json
  fs.writeFileSync(CANDIDATE_ONLY_EVIDENCE_PATH, JSON.stringify(candidateOnlyFiltered, null, 2), "utf8");

  // Write scripts/audit_ledger_ids.json
  fs.writeFileSync(LEDGER_IDS_PATH, JSON.stringify(sortedCompletedUniqueIds, null, 2), "utf8");

  // Write scripts/audit_ledger.json
  const masterLedgerDict: Record<string, any> = {};
  for (const ev of completedEntries) {
    if (!masterLedgerDict[ev.courseId]) {
      masterLedgerDict[ev.courseId] = {
        courseId: ev.courseId,
        verdict: ev.verdict,
        firstAuditedBatch: ev.source,
        lastAuditedBatch: ev.source,
        auditCount: 1,
        batchesAppeared: [ev.source]
      };
    } else {
      masterLedgerDict[ev.courseId].auditCount++;
      masterLedgerDict[ev.courseId].lastAuditedBatch = ev.source;
      if (!masterLedgerDict[ev.courseId].batchesAppeared.includes(ev.source)) {
        masterLedgerDict[ev.courseId].batchesAppeared.push(ev.source);
      }
    }
  }
  fs.writeFileSync(LEDGER_JSON_PATH, JSON.stringify({ entries: masterLedgerDict }, null, 2), "utf8");

  const rawCompletedTotal = completedEntries.length;
  const rawCandidateOnlyTotal = candidateOnlyFiltered.length;
  const uniqueCompletedTotal = sortedCompletedUniqueIds.length;
  const candidateOnlyUniqueCount = new Set(candidateOnlyFiltered.map(e => e.courseId)).size;
  const trueRemainingUnaudited = totalDbCourseCount - uniqueCompletedTotal;

  console.log("=== SEMANTIC EVIDENCE & RECONCILIATION SUMMARY ===");
  console.log(`1. Raw Course ID occurrences found        : ${rawCompletedTotal + rawCandidateOnlyTotal}`);
  console.log(`2. Completed-audit evidence entries       : ${rawCompletedTotal}`);
  console.log(`3. Candidate-only / non-audit occurrences : ${rawCandidateOnlyTotal} (${candidateOnlyUniqueCount} unique candidate-only IDs)`);
  console.log(`4. True UNIQUE completed audited IDs      : ${uniqueCompletedTotal}`);
  console.log(`5. Total DB courses                       : ${totalDbCourseCount}`);
  console.log(`6. True remaining unaudited count         : ${trueRemainingUnaudited} / ${totalDbCourseCount}\n`);

  // MANDATORY KNOWN-ID ASSERTIONS
  console.log("=== MANDATORY KNOWN-ID COMPLETED LEDGER ASSERTIONS ===");
  const missingKnownIds: string[] = [];

  for (const kid of MANDATORY_KNOWN_IDS) {
    const present = completedUniqueIdsSet.has(kid);
    console.log(`- Known ID [${kid}] in audit_ledger_ids.json? ${present}`);
    if (!present) {
      missingKnownIds.push(kid);
    }
  }

  if (missingKnownIds.length > 0) {
    console.error(`\n❌ MANDATORY ASSERTION FAILED! Missing ${missingKnownIds.length} known IDs:`, missingKnownIds);
    process.exit(1);
  }

  console.log("\n✓ ALL MANDATORY KNOWN-IDs VERIFIED PRESENT IN COMPLETED LEDGER!\n");

  // PRINT 20 SAMPLE COMPLETED LEDGER IDs WITH VERDICT & SOURCE
  console.log("=== SAMPLE 20 COMPLETED LEDGER IDs (WITH VERDICT & EVIDENCE SOURCE) ===");
  const sampleLedgerIds = sortedCompletedUniqueIds.slice(0, 20);
  sampleLedgerIds.forEach((id, idx) => {
    const entry = masterLedgerDict[id];
    const course = allCoursesDb.find(c => c.id === id);
    console.log(`${idx + 1}. [${id}] Skill: "${course?.skill.name}" | Verdict: ${entry.verdict} | Source: ${entry.firstAuditedBatch}`);
  });

  // PRINT 20 CANDIDATE-ONLY IDs PROVING EXCLUSION FROM LEDGER
  console.log("\n=== SAMPLE 20 CANDIDATE-ONLY IDs (EXCLUDED FROM COMPLETED LEDGER) ===");
  const candidateOnlyUniqueIds = Array.from(new Set(candidateOnlyFiltered.map(e => e.courseId))).slice(0, 20);
  candidateOnlyUniqueIds.forEach((id, idx) => {
    const course = allCoursesDb.find(c => c.id === id);
    const inLedger = completedUniqueIdsSet.has(id);
    console.log(`${idx + 1}. [${id}] Skill: "${course?.skill.name}" | Excluded from Completed Ledger? ${!inLedger}`);
  });

  // -------------------------------------------------------------------------
  // CANDIDATE SELECTION FOR NEXT 50 (ALL_DB_IDS MINUS COMPLETED_AUDIT_LEDGER_IDS)
  // -------------------------------------------------------------------------
  console.log("\n======================================================================");
  console.log("=== SELECTING NEXT 50 CANDIDATES FROM UNAUDITED SET ===");
  console.log("======================================================================\n");

  const unauditedCourses = allCoursesDb.filter(c => !completedUniqueIdsSet.has(c.id));
  const candidate50Courses = unauditedCourses.slice(0, 50);
  const candidate50Ids = candidate50Courses.map(c => c.id);

  // Candidate Assertions
  const candidateCountCheck = candidate50Ids.length === 50;
  const candidateUniqueCheck = new Set(candidate50Ids).size === candidate50Ids.length;

  let candidateCompletedOverlap = 0;
  for (const cid of candidate50Ids) {
    if (completedUniqueIdsSet.has(cid)) candidateCompletedOverlap++;
  }

  const knownIdInCandidateFailures: string[] = [];
  for (const kid of MANDATORY_KNOWN_IDS) {
    if (candidate50Ids.includes(kid)) {
      knownIdInCandidateFailures.push(kid);
    }
  }

  console.log(`- candidate count = 50                       : ${candidateCountCheck} (${candidate50Ids.length})`);
  console.log(`- candidate IDs unique                       : ${candidateUniqueCheck}`);
  console.log(`- candidate ∩ COMPLETED audit_ledger_ids     : ${candidateCompletedOverlap}`);
  console.log(`- known repeated IDs in candidates           : ${knownIdInCandidateFailures.length}`);

  if (!candidateCountCheck || !candidateUniqueCheck || candidateCompletedOverlap > 0 || knownIdInCandidateFailures.length > 0) {
    console.error("❌ CANDIDATE ASSERTION FAILED! ABORTING SCRIPT.");
    process.exit(1);
  }

  console.log("\n`Overlap with COMPLETED audit_ledger_ids: 0`");
  console.log("✓ Confirmation: ALL CANDIDATE ASSERTIONS PASSED CLEANLY!\n");

  console.log("=== NEXT 50 CANDIDATE COURSE IDs (FIRST 20 SHOWN) ===");
  candidate50Courses.slice(0, 20).forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.id}] Skill: "${c.skill.name}" | Provider: "${c.provider.name}" | Title: "${c.title}"`);
  });
  console.log(`... and ${candidate50Courses.length - 20} more candidate IDs selected.`);

  console.log("\n==========================================================================");
  console.log("=== FINAL AUTHORITATIVE SEMANTIC REPORT ===");
  console.log("======================================================================");
  console.log(`1. Why candidate IDs were missing    : Parsed non-audit candidate listings. Separated semantically.`);
  console.log(`2. Raw evidence entry count          : ${rawCompletedTotal + rawCandidateOnlyTotal}`);
  console.log(`3. Completed-audit evidence entries  : ${rawCompletedTotal}`);
  console.log(`4. Candidate-only evidence entries   : ${rawCandidateOnlyTotal} (${candidateOnlyUniqueCount} unique IDs)`);
  console.log(`5. True UNIQUE completed audited count: ${uniqueCompletedTotal}`);
  console.log(`6. True remaining unaudited count    : ${trueRemainingUnaudited} / ${totalDbCourseCount}`);
  console.log(`7. Known-ID assertion result         : PASSED (8/8 verified present)`);
  console.log(`8. Next 50 candidate IDs count       : ${candidate50Ids.length}`);
  console.log(`9. Candidate overlap with ledger     : ${candidateCompletedOverlap}`);
  console.log(`10. Known repeated IDs in candidates : 0 (PASSED)`);
  console.log("======================================================================\n");

  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
