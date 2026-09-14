import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

async function traceSelections() {
  const knownDupId = "cmtz8kt2b0082wubkod0ymp4k";

  const p1Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts"), "utf8");
  const p2Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const precScript = fs.readFileSync(path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts"), "utf8");
  const b1CorrScript = fs.readFileSync(path.join(process.cwd(), "scripts/apply-50-batch-corrections.ts"), "utf8");

  const p1Ids = [...p1Script.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  const p2FixIds = [...p2Script.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  const precIds = [...precScript.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
  const b1CorrIds = [...b1CorrScript.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);

  console.log(`Known Dup ID ${knownDupId} in:`);
  console.log(`- Phase 1: ${p1Ids.includes(knownDupId)}`);
  console.log(`- Phase 2: ${p2FixIds.includes(knownDupId)}`);
  console.log(`- Precision: ${precIds.includes(knownDupId)}`);
  console.log(`- Batch 1 Corrections: ${b1CorrIds.includes(knownDupId)}`);

  // Fetch all courses in DB ordered by createdAt: "asc", id: "asc"
  const allCourses = await db.course.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, title: true, skill: { select: { name: true } } }
  });

  const knownCourse = allCourses.find(c => c.id === knownDupId);
  const indexInAll = allCourses.findIndex(c => c.id === knownDupId);
  console.log(`\nKnown Course position in DB allCourses: index ${indexInAll} / ${allCourses.length}`);
  console.log(`Skill: "${knownCourse?.skill.name}" | Title: "${knownCourse?.title}"`);

  // Let's check how Batch 1 was selected when export-50-batch.ts ran:
  // In export-50-batch.ts, auditedIds was built from p1Ids, p2FixIds, precIds.
  const auditedIdsBatch1 = new Set([...p1Ids, ...p2FixIds, ...precIds]);
  const b1Selected = allCourses.filter(c => !auditedIdsBatch1.has(c.id)).slice(0, 50);
  const b1SelectedIds = b1Selected.map(c => c.id);

  console.log(`\nb1Selected contains knownDupId? ${b1SelectedIds.includes(knownDupId)} (Index #${b1SelectedIds.indexOf(knownDupId)})`);

  // Let's check Batch 2 selection when audit-batch-50-next.ts ran:
  // In audit-batch-50-next.ts, auditedIds was built from p1Ids, p2FixIds, precIds, and b1CorrIds!
  const auditedIdsBatch2 = new Set([...p1Ids, ...p2FixIds, ...precIds, ...b1CorrIds]);
  const b2Selected = allCourses.filter(c => !auditedIdsBatch2.has(c.id)).slice(0, 50);
  const b2SelectedIds = b2Selected.map(c => c.id);

  console.log(`b2Selected contains knownDupId? ${b2SelectedIds.includes(knownDupId)} (Index #${b2SelectedIds.indexOf(knownDupId)})`);

  await db.$disconnect();
}

traceSelections().catch(console.error);
