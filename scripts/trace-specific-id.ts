import * as fs from "fs";
import * as path from "path";

async function traceId() {
  const targetId = "cmtz8kt2b0082wubkod0ymp4k";
  console.log(`=== TRACING ${targetId} ACROSS ALL REPO FILES & LOGS ===\n`);

  const scriptsDir = path.join(process.cwd(), "scripts");
  const files = fs.readdirSync(scriptsDir);

  for (const f of files) {
    const full = path.join(scriptsDir, f);
    if (fs.statSync(full).isFile()) {
      const content = fs.readFileSync(full, "utf8");
      if (content.includes(targetId)) {
        console.log(`Found in script file: scripts/${f}`);
      }
    }
  }

  const tasksDir = "C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\a1469f0e-2817-4b44-83ab-6f7a1e3adbfb\\.system_generated\\tasks";
  if (fs.existsSync(tasksDir)) {
    const logFiles = fs.readdirSync(tasksDir);
    for (const lf of logFiles) {
      const full = path.join(tasksDir, lf);
      const content = fs.readFileSync(full, "utf8");
      if (content.includes(targetId)) {
        console.log(`Found in task log: .system_generated/tasks/${lf}`);
      }
    }
  }
}

traceId().catch(console.error);
