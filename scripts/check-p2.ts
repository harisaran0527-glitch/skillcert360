import * as fs from "fs";
import * as path from "path";

async function checkP2() {
  const p2File = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const knownDupId = "cmtz8kt2b0082wubkod0ymp4k";
  console.log(`p2File includes knownDupId (${knownDupId})? ${p2File.includes(knownDupId)}`);

  const p2Matches = [...p2File.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  console.log(`p2FixIds contains knownDupId? ${p2Matches.includes(knownDupId)}`);
}

checkP2().catch(console.error);
