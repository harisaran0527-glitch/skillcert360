import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

async function main() {
  const p1Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts"), "utf8");
  const p2Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const precScript = fs.readFileSync(path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts"), "utf8");

  const p1Ids = [...p1Script.matchAll(/id:\s*"([^"]+)"|courseId:\s*"([^"]+)"/g)].map(m => m[1] || m[2]);
  const p2Ids = [...p2Script.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  const precIds = [...precScript.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);

  const auditedIds = new Set([...p1Ids, ...p2Ids, ...precIds]);

  const allCourses = await db.course.findMany({
    orderBy: { createdAt: "asc" },
    include: { provider: true, skill: true }
  });

  const nextBatch = allCourses.filter(c => !auditedIds.has(c.id)).slice(0, 50);

  for (let i = 0; i < 16; i++) {
    const c = nextBatch[i];
    console.log(`${i+1}. [${c.id}] Skill: "${c.skill.name}" (${c.skill.levelId}) | Provider: "${c.provider.name}" | Title: "${c.title}" | URL: ${c.officialUrl}`);
  }

  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
