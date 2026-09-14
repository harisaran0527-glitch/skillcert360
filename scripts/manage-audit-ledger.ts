import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();
const LEDGER_PATH = path.join(process.cwd(), "scripts/audit_ledger.json");

interface LedgerEntry {
  courseId: string;
  skillName: string;
  status: "VERIFIED" | "CORRECTED" | "UNRESOLVED";
  batch: string;
  auditedAt: string;
}

interface AuditLedger {
  entries: Record<string, LedgerEntry>;
}

export function loadLedger(): AuditLedger {
  if (fs.existsSync(LEDGER_PATH)) {
    try {
      const data = fs.readFileSync(LEDGER_PATH, "utf8");
      return JSON.parse(data);
    } catch (e) {
      console.warn("Could not parse ledger, creating new.", e);
    }
  }
  return { entries: {} };
}

export function saveLedger(ledger: AuditLedger) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), "utf8");
}

async function initializeLedgerFromHistory() {
  const ledger = loadLedger();

  const p1Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts"), "utf8");
  const p2Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const precScript = fs.readFileSync(path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts"), "utf8");
  const b50Script = fs.readFileSync(path.join(process.cwd(), "scripts/apply-50-batch-corrections.ts"), "utf8");
  const b50Audit = fs.readFileSync(path.join(process.cwd(), "scripts/audit-50-batch-read-only.ts"), "utf8");

  // Extract all IDs from prior scripts
  const p1Ids = [...p1Script.matchAll(/id:\s*"([^"]+)"|courseId:\s*"([^"]+)"/g)].map(m => m[1] || m[2]);
  const p2Ids = [...p2Script.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  const precIds = [...precScript.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
  const b50CorrIds = [...b50Script.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
  const b50AuditIds = [...b50Audit.matchAll(/Record #\d+ \[([^\]]+)\]/g)].map(m => m[1]);

  for (const id of p1Ids) {
    if (!ledger.entries[id]) {
      ledger.entries[id] = { courseId: id, skillName: "Phase 1 Skill", status: "CORRECTED", batch: "Phase 1", auditedAt: new Date().toISOString() };
    }
  }

  for (const id of p2Ids) {
    if (!ledger.entries[id]) {
      ledger.entries[id] = { courseId: id, skillName: "Phase 2 Skill", status: "CORRECTED", batch: "Phase 2", auditedAt: new Date().toISOString() };
    }
  }

  for (const id of precIds) {
    if (ledger.entries[id]) {
      ledger.entries[id].status = "CORRECTED";
      ledger.entries[id].batch = "23 Precision Batch";
    } else {
      ledger.entries[id] = { courseId: id, skillName: "Precision Skill", status: "CORRECTED", batch: "23 Precision Batch", auditedAt: new Date().toISOString() };
    }
  }

  for (const id of b50AuditIds) {
    const isCorr = b50CorrIds.includes(id);
    if (!ledger.entries[id]) {
      ledger.entries[id] = { courseId: id, skillName: "50-Batch 1 Skill", status: isCorr ? "CORRECTED" : "VERIFIED", batch: "Batch 1 (50)", auditedAt: new Date().toISOString() };
    }
  }

  saveLedger(ledger);
  console.log(`Initialized ledger with ${Object.keys(ledger.entries).length} previously audited course IDs.`);
}

if (require.main === module) {
  initializeLedgerFromHistory().then(() => db.$disconnect());
}
