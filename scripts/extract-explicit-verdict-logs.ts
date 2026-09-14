import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const KNOWN_7 = [
  "cmtz8kt2b007rwubkul3yaf8s",
  "cmtz8kt2b007twubkpxb69tfr",
  "cmtz8kt2b007xwubkc5mk6cu2",
  "cmtz8kt2b0081wubk2hgpx9be",
  "cmtz8kt2b0084wubkm8f058d0",
  "cmtz8kt2b008mwubkmw5fvmtw",
  "cmtz8kt2b008pwubkt0hzh852"
];

async function extractLogVerdicts() {
  console.log("=== SEARCHING TASK LOGS AND TRANSCRIPT FOR EXPLICIT VERDICT LINES ===\n");

  const tasksDir = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\tasks";
  const transcriptPath = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\logs\\transcript_full.jsonl";

  const foundVerdicts: Array<{ id: string; verdict: string; source: string; line: string }> = [];

  // Search task logs
  if (fs.existsSync(tasksDir)) {
    const files = fs.readdirSync(tasksDir);
    for (const f of files) {
      if (f.endsWith(".log")) {
        const content = fs.readFileSync(path.join(tasksDir, f), "utf8");
        const lines = content.split("\n");
        let currentId: string | null = null;

        for (const line of lines) {
          const idMatch = line.match(/\[(cmtz[a-z0-9]{21})\]/);
          if (idMatch) currentId = idMatch[1];

          if (line.includes("VERDICT") || line.includes("✓ Applied") || line.includes("Applied [")) {
            const matches = [...line.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0]);
            const target = currentId || matches[0];
            if (target) {
              let v = "VERIFIED";
              if (line.includes("NEEDS_CORRECTION") || line.includes("Applied")) v = "CORRECTED";
              if (line.includes("UNRESOLVED")) v = "UNRESOLVED";
              foundVerdicts.push({ id: target, verdict: v, source: `task-log-${f}`, line: line.trim() });
            }
          }
        }
      }
    }
  }

  // Search transcript full
  if (fs.existsSync(transcriptPath)) {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      if (line.includes("VERDICT") || line.includes("✓ Applied") || line.includes("Applied [")) {
        const matches = [...line.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0]);
        for (const id of matches) {
          let v = "VERIFIED";
          if (line.includes("NEEDS_CORRECTION") || line.includes("Applied")) v = "CORRECTED";
          if (line.includes("UNRESOLVED")) v = "UNRESOLVED";
          foundVerdicts.push({ id, verdict: v, source: "transcript_full.jsonl", line: line.slice(0, 120) });
        }
      }
    }
  }

  console.log(`Found ${foundVerdicts.length} total explicit log/transcript verdict entries.`);

  const uniqueVerdictIds = Array.from(new Set(foundVerdicts.map(v => v.id)));
  console.log(`Unique course IDs with explicit log/transcript verdicts: ${uniqueVerdictIds.length}\n`);

  console.log("Known 7 IDs in explicit log/transcript verdicts:");
  for (const kid of KNOWN_7) {
    const matches = foundVerdicts.filter(v => v.id === kid);
    console.log(`- [${kid}]: Matches count = ${matches.length}`);
    if (matches.length > 0) {
      console.log(`  Sample: ${matches[0].source} → verdict: ${matches[0].verdict}`);
    }
  }
}

extractLogVerdicts().catch(console.error);
