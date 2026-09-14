import * as fs from "fs";
import * as readline from "readline";

async function main() {
  const transcriptPath = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\logs\\transcript_full.jsonl";
  
  if (!fs.existsSync(transcriptPath)) {
    console.error("Full transcript file not found:", transcriptPath);
    return;
  }

  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const batch1Ids = new Set<string>();
  const batch2Ids = new Set<string>();

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      const text = JSON.stringify(step);

      if (text.includes("DRY-RUN AUDIT REPORT: NEXT 50 CATALOGUE RECORDS") || text.includes("audit-50-batch-read-only.ts")) {
        const matches = [...text.matchAll(/Record #\d+ \[([^\]]+)\]/g)].map(m => m[1]);
        for (const id of matches) batch1Ids.add(id);
      }

      if (text.includes("BATCH 2 READ-ONLY AUDIT: NEXT 50 CATALOGUE RECORDS") || text.includes("BATCH 2 FINAL AUDIT REPORT SUMMARY") || text.includes("audit-batch-50-next.ts")) {
        const matches = [...text.matchAll(/Record #\d+ \[([^\]]+)\]/g)].map(m => m[1]);
        for (const id of matches) batch2Ids.add(id);
      }
    } catch (e) {}
  }

  console.log(`Extracted Batch 1 IDs from full transcript: ${batch1Ids.size}`);
  console.log(`Extracted Batch 2 IDs from full transcript: ${batch2Ids.size}`);

  console.log("\nBatch 1 IDs count:", batch1Ids.size);
  console.log(Array.from(batch1Ids));

  console.log("\nBatch 2 IDs count:", batch2Ids.size);
  console.log(Array.from(batch2Ids));
}

main().catch(console.error);
