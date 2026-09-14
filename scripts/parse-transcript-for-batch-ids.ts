import * as fs from "fs";
import * as path from "path";

async function main() {
  const transcriptPath = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\logs\\transcript.jsonl";
  
  if (!fs.existsSync(transcriptPath)) {
    console.error("Transcript file not found:", transcriptPath);
    return;
  }

  const content = fs.readFileSync(transcriptPath, "utf8");

  // Search for course IDs starting with cmtz
  const allCmtzIds = [...content.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0]);
  const uniqueIds = Array.from(new Set(allCmtzIds));

  console.log(`Found ${allCmtzIds.length} total ID matches in transcript.`);
  console.log(`Found ${uniqueIds.length} unique course ID matches in transcript.\n`);

  // Let's also parse task log files in .system_generated/tasks
  const tasksDir = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\tasks";
  const files = fs.readdirSync(tasksDir);

  const taskLogIds = new Set<string>();
  for (const f of files) {
    if (f.endsWith(".log")) {
      const logContent = fs.readFileSync(path.join(tasksDir, f), "utf8");
      const matches = [...logContent.matchAll(/cmtz[a-z0-9]{21}/g)].map(m => m[0]);
      for (const id of matches) taskLogIds.add(id);
    }
  }

  console.log(`Found ${taskLogIds.size} unique course IDs in task log files.\n`);

  const combinedUnique = Array.from(new Set([...uniqueIds, ...Array.from(taskLogIds)]));
  console.log(`Total unique course IDs across transcript and logs: ${combinedUnique.length}`);
}

main().catch(console.error);
