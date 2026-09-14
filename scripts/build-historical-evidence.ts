import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

export interface EvidenceEntry {
  courseId: string;
  source: string;
  verdict: "VERIFIED" | "CORRECTED" | "UNRESOLVED";
  evidenceType: "report" | "log" | "correction-array";
  detail?: string;
}

const EVIDENCE_FILE_PATH = path.join(process.cwd(), "scripts/historical_audit_evidence.json");
const LEDGER_IDS_PATH = path.join(process.cwd(), "scripts/audit_ledger_ids.json");
const LEDGER_JSON_PATH = path.join(process.cwd(), "scripts/audit_ledger.json");

const MANDATORY_KNOWN_IDS = [
  "cmtz8kt2b007rwubkul3yaf8s",
  "cmtz8kt2b007twubkpxb69tfr",
  "cmtz8kt2b007xwubkc5mk6cu2",
  "cmtz8kt2b0081wubk2hgpx9be",
  "cmtz8kt2b0084wubkm8f058d0",
  "cmtz8kt2b008mwubkmw5fvmtw",
  "cmtz8kt2b008pwubkt0hzh852",
  "cmtz8kt2b0082wubkod0ymp4k"
];

async function collectEvidence() {
  console.log("======================================================================");
  console.log("=== BUILDING RAW HISTORICAL AUDIT EVIDENCE (TASK LOGS + TRANSCRIPT) ===");
  console.log("======================================================================\n");

  const evidenceList: EvidenceEntry[] = [];

  // 1. Phase 1 script (fix-bad-records-phase1.ts)
  const p1Path = path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts");
  if (fs.existsSync(p1Path)) {
    const content = fs.readFileSync(p1Path, "utf8");
    const matches = [...content.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
    for (const id of matches) {
      evidenceList.push({
        courseId: id,
        source: "Phase 1",
        verdict: "CORRECTED",
        evidenceType: "correction-array",
        detail: "Phase 1 13 Bad Records script FIXES array"
      });
    }
  }

  // 2. Phase 2 script (fix-ms-browse-records-phase2.ts)
  const p2Path = path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts");
  if (fs.existsSync(p2Path)) {
    const content = fs.readFileSync(p2Path, "utf8");
    const matches = [...content.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
    for (const id of matches) {
      evidenceList.push({
        courseId: id,
        source: "Phase 2",
        verdict: "CORRECTED",
        evidenceType: "correction-array",
        detail: "Phase 2 FIXES array"
      });
    }
  }

  // 3. 23 Precision Batch script (apply-23-precision-fixes.ts)
  const precPath = path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts");
  if (fs.existsSync(precPath)) {
    const content = fs.readFileSync(precPath, "utf8");
    const matches = [...content.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
    for (const id of matches) {
      const isUnresolved = content.includes(`id: "${id}"`) && content.includes(`verdict: "UNRESOLVED"`);
      evidenceList.push({
        courseId: id,
        source: "23-Record Precision Batch",
        verdict: isUnresolved ? "UNRESOLVED" : "CORRECTED",
        evidenceType: "correction-array",
        detail: "apply-23-precision-fixes.ts PRECISION_FIXES array"
      });
    }
  }

  // 4. Batch 1 corrections script (apply-50-batch-corrections.ts)
  const b1CorrPath = path.join(process.cwd(), "scripts/apply-50-batch-corrections.ts");
  if (fs.existsSync(b1CorrPath)) {
    const content = fs.readFileSync(b1CorrPath, "utf8");
    const matches = [...content.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
    for (const id of matches) {
      evidenceList.push({
        courseId: id,
        source: "Batch 1 Corrections",
        verdict: "CORRECTED",
        evidenceType: "correction-array",
        detail: "apply-50-batch-corrections.ts CORRECTIONS array"
      });
    }
  }

  // 5. Parse ALL task log files in .system_generated/tasks/
  const tasksDir = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\tasks";
  if (fs.existsSync(tasksDir)) {
    const files = fs.readdirSync(tasksDir);
    for (const f of files) {
      if (f.endsWith(".log")) {
        const logContent = fs.readFileSync(path.join(tasksDir, f), "utf8");
        // Extract all Record #[id] or [id] patterns
        const matches = [...logContent.matchAll(/\[(cmtz[a-z0-9]{21})\]/g)].map(m => m[1]);
        for (const id of matches) {
          let source = "Task Log " + f;
          if (logContent.includes("POST-APPLY STRICT AUDIT") || logContent.includes("task-1920")) {
            source = "Phase 2 Post-Apply Audit Report";
          } else if (logContent.includes("RE-AUDIT PRECISION APPLY") || logContent.includes("task-1963")) {
            source = "23 Precision Apply Log";
          } else if (logContent.includes("APPLYING 14 VERIFIED CORRECTIONS") || logContent.includes("task-2009")) {
            source = "Batch 1 Apply Log";
          } else if (logContent.includes("BATCH 2 READ-ONLY AUDIT") || logContent.includes("task-1920")) {
            source = "Batch 2 Audit Log";
          }

          let verdict: "VERIFIED" | "CORRECTED" | "UNRESOLVED" = "VERIFIED";
          if (logContent.includes(`[${id}]`) && logContent.includes("UNRESOLVED")) verdict = "UNRESOLVED";
          if (logContent.includes(`Applied [${id.slice(-8)}]`)) verdict = "CORRECTED";

          evidenceList.push({
            courseId: id,
            source,
            verdict,
            evidenceType: "log",
            detail: `Found in task log ${f}`
          });
        }
      }
    }
  }

  // 6. Parse FULL TRANSCRIPT JSONL line by line for explicit report output text
  const transcriptPath = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\logs\\transcript_full.jsonl";
  if (fs.existsSync(transcriptPath)) {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      // Match all cmtz IDs in the line
      const matches = [...line.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0]);
      if (matches.length > 0) {
        let source = "Transcript Execution Output";
        let evType: EvidenceEntry["evidenceType"] = "report";
        if (line.includes("POST-APPLY STRICT AUDIT OF ALL 108")) {
          source = "Phase 2 Post-Apply Audit Report";
        } else if (line.includes("DRY-RUN AUDIT REPORT: NEXT 50 CATALOGUE RECORDS")) {
          source = "Batch 1 Audit Report";
        } else if (line.includes("BATCH 2 READ-ONLY AUDIT: NEXT 50 CATALOGUE RECORDS")) {
          source = "Batch 2 Audit Report";
        } else if (line.includes("RE-AUDIT PRECISION APPLY")) {
          source = "23 Precision Audit Report";
        }

        for (const id of matches) {
          evidenceList.push({
            courseId: id,
            source,
            verdict: "VERIFIED",
            evidenceType: evType,
            detail: "Extracted from full transcript execution log"
          });
        }
      }
    }
  }

  console.log(`Collected ${evidenceList.length} raw historical evidence entries.`);

  // Save raw evidence file
  fs.writeFileSync(EVIDENCE_FILE_PATH, JSON.stringify(evidenceList, null, 2), "utf8");
  console.log(`Saved raw evidence file: scripts/historical_audit_evidence.json`);

  // Derive audit_ledger_ids.json (UNIQUE courseIds)
  const uniqueAuditedIdsSet = new Set(evidenceList.map(e => e.courseId));
  const sortedUniqueIds = Array.from(uniqueAuditedIdsSet).sort();

  fs.writeFileSync(LEDGER_IDS_PATH, JSON.stringify(sortedUniqueIds, null, 2), "utf8");
  console.log(`Derived sorted unique audit ledger IDs file: scripts/audit_ledger_ids.json (${sortedUniqueIds.length} unique IDs)\n`);

  // MANDATORY KNOWN-ID ASSERTIONS
  console.log("=== MANDATORY KNOWN-ID ASSERTIONS CHECK ===");
  const missingKnownIds: string[] = [];

  for (const kid of MANDATORY_KNOWN_IDS) {
    const exists = uniqueAuditedIdsSet.has(kid);
    console.log(`- Known ID [${kid}] in audit_ledger_ids.json? ${exists}`);
    if (!exists) {
      missingKnownIds.push(kid);
    }
  }

  if (missingKnownIds.length > 0) {
    console.error(`\n❌ MANDATORY ASSERTION FAILED! The following ${missingKnownIds.length} mandatory IDs are MISSING from ledger IDs:`);
    missingKnownIds.forEach(id => console.error(`  - ${id}`));
    console.error("ABORTING SCRIPT EXECUTION.");
    process.exit(1);
  }

  console.log("\n✓ ALL MANDATORY KNOWN-IDs ARE PRESENT IN LEDGER IDs!\n");
}

collectEvidence().catch(e => {
  console.error(e);
  process.exit(1);
});
