import * as fs from "fs";
import * as path from "path";

async function extractExplicitIds() {
  console.log("=== EXTRACTING EXPLICIT IDs FROM ALL SCRIPTS AND LOGS ===\n");

  const p1File = fs.readFileSync(path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts"), "utf8");
  const p2File = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const precFile = fs.readFileSync(path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts"), "utf8");
  const b1AuditFile = fs.readFileSync(path.join(process.cwd(), "scripts/audit-50-batch-read-only.ts"), "utf8");
  const b1CorrFile = fs.readFileSync(path.join(process.cwd(), "scripts/apply-50-batch-corrections.ts"), "utf8");
  const b2AuditFile = fs.readFileSync(path.join(process.cwd(), "scripts/audit-batch-50-next.ts"), "utf8");

  const p1Ids = Array.from(new Set([...p1File.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0])));
  const p2Ids = Array.from(new Set([...p2File.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0])));
  const precIds = Array.from(new Set([...precFile.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0])));
  const b1CorrIds = Array.from(new Set([...b1CorrFile.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0])));
  const b1AuditIds = Array.from(new Set([...b1AuditFile.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0])));
  const b2AuditIds = Array.from(new Set([...b2AuditFile.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0])));

  console.log(`Phase 1 explicit IDs      : ${p1Ids.length}`);
  console.log(`Phase 2 explicit IDs      : ${p2Ids.length}`);
  console.log(`Precision explicit IDs    : ${precIds.length}`);
  console.log(`Batch 1 Corr explicit IDs : ${b1CorrIds.length}`);
  console.log(`Batch 1 Audit explicit IDs: ${b1AuditIds.length}`);
  console.log(`Batch 2 Audit explicit IDs: ${b2AuditIds.length}`);

  const knownDupId = "cmtz8kt2b0082wubkod0ymp4k";
  console.log(`\nknownDupId (${knownDupId}) in Batch 1 Corr? ${b1CorrIds.includes(knownDupId)}`);
  console.log(`knownDupId (${knownDupId}) in Batch 1 Audit? ${b1AuditIds.includes(knownDupId)}`);
}

extractExplicitIds().catch(console.error);
