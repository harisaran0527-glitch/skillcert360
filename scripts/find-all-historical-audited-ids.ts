import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

interface AuditedItem {
  id: string;
  source: string;
  verdict: "VERIFIED" | "CORRECTED" | "UNRESOLVED";
}

async function main() {
  console.log("=== SEARCHING ALL HISTORICAL AUDIT LOGS & SCRIPTS FOR COURSE IDs ===\n");

  const auditedItems: AuditedItem[] = [];

  // 1. Phase 1
  const p1Path = path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts");
  if (fs.existsSync(p1Path)) {
    const content = fs.readFileSync(p1Path, "utf8");
    const matches = [...content.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
    for (const id of matches) {
      auditedItems.push({ id, source: "Phase 1", verdict: "CORRECTED" });
    }
  }

  // 2. Phase 2
  const p2Path = path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts");
  if (fs.existsSync(p2Path)) {
    const content = fs.readFileSync(p2Path, "utf8");
    const matches = [...content.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
    for (const id of matches) {
      auditedItems.push({ id, source: "Phase 2", verdict: "CORRECTED" });
    }
  }

  // 3. 23 Precision Batch
  const precPath = path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts");
  if (fs.existsSync(precPath)) {
    const content = fs.readFileSync(precPath, "utf8");
    const matches = [...content.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
    for (const id of matches) {
      const isUnresolved = content.includes(`id: "${id}"`) && content.includes(`verdict: "UNRESOLVED"`);
      auditedItems.push({ id, source: "23-Record Precision Batch", verdict: isUnresolved ? "UNRESOLVED" : "CORRECTED" });
    }
  }

  // 4. Batch 1 Corrections Script (14 records)
  const b1CorrPath = path.join(process.cwd(), "scripts/apply-50-batch-corrections.ts");
  if (fs.existsSync(b1CorrPath)) {
    const content = fs.readFileSync(b1CorrPath, "utf8");
    const matches = [...content.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
    for (const id of matches) {
      auditedItems.push({ id, source: "Batch 1 (50-Series)", verdict: "CORRECTED" });
    }
  }

  // 5. Batch 1 Audit Script (50 records)
  const b1AuditPath = path.join(process.cwd(), "scripts/audit-50-batch-read-only.ts");
  if (fs.existsSync(b1AuditPath)) {
    const content = fs.readFileSync(b1AuditPath, "utf8");
    const matches = [...content.matchAll(/id:\s*c\.id/g)]; // Dynamically selects from db
  }

  // Let's parse full transcript line by line for any tool_calls or content containing cmtz
  const transcriptPath = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\logs\\transcript_full.jsonl";
  
  if (fs.existsSync(transcriptPath)) {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      if (line.includes("export-50-batch.ts") || line.includes("audit-50-batch-read-only.ts") || line.includes("audit-batch-50-next.ts")) {
        // Extract all cmtz IDs in this line
        const matches = [...line.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0]);
        for (const id of matches) {
          if (line.includes("audit-50-batch-read-only.ts") || line.includes("export-50-batch.ts")) {
            auditedItems.push({ id, source: "Batch 1 (50-Series)", verdict: "VERIFIED" });
          } else if (line.includes("audit-batch-50-next.ts")) {
            auditedItems.push({ id, source: "Batch 2 (50-Series)", verdict: "VERIFIED" });
          }
        }
      }
    }
  }

  // 6. Also check all task logs in .system_generated/tasks
  const tasksDir = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\tasks";
  if (fs.existsSync(tasksDir)) {
    const taskFiles = fs.readdirSync(tasksDir);
    for (const tf of taskFiles) {
      const logContent = fs.readFileSync(path.join(tasksDir, tf), "utf8");
      if (logContent.includes("audit-50-batch-read-only") || logContent.includes("export-50-batch") || logContent.includes("apply-50-batch-corrections") || logContent.includes("audit-batch-50-next")) {
        const matches = [...logContent.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0]);
        for (const id of matches) {
          if (logContent.includes("audit-50-batch-read-only") || logContent.includes("export-50-batch") || logContent.includes("apply-50-batch-corrections")) {
            auditedItems.push({ id, source: "Batch 1 (50-Series)", verdict: "VERIFIED" });
          } else if (logContent.includes("audit-batch-50-next")) {
            auditedItems.push({ id, source: "Batch 2 (50-Series)", verdict: "VERIFIED" });
          }
        }
      }
    }
  }

  console.log(`Total raw historical items collected: ${auditedItems.length}`);

  const bySource = new Map<string, Set<string>>();
  for (const item of auditedItems) {
    const set = bySource.get(item.source) || new Set<string>();
    set.add(item.id);
    bySource.set(item.source, set);
  }

  for (const [src, set] of bySource.entries()) {
    console.log(`- ${src}: ${set.size} unique IDs`);
  }
}

main().catch(console.error);
