import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

async function testB1Selection() {
  const p1File = fs.readFileSync(path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts"), "utf8");
  const p2File = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const precFile = fs.readFileSync(path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts"), "utf8");

  const p1Ids = [...p1File.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  const p2FixIds = [...p2File.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  const precIds = [...precFile.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);

  const auditedIds = new Set([...p1Ids, ...p2FixIds, ...precIds]);

  const allCourses = await db.course.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, skill: { select: { name: true } } }
  });

  const b1Selected = allCourses.filter(c => !auditedIds.has(c.id)).slice(0, 50);
  const b1Ids = b1Selected.map(c => c.id);

  const knownDupId = "cmtz8kt2b0082wubkod0ymp4k";
  console.log(`b1Ids contains knownDupId (${knownDupId})? ${b1Ids.includes(knownDupId)}`);
  if (b1Ids.includes(knownDupId)) {
    console.log(`Position in b1Ids: #${b1Ids.indexOf(knownDupId) + 1}`);
  }

  await db.$disconnect();
}

testB1Selection().catch(console.error);
