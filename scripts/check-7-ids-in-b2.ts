import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

const KNOWN_7 = [
  "cmtz8kt2b007rwubkul3yaf8s",
  "cmtz8kt2b007twubkpxb69tfr",
  "cmtz8kt2b007xwubkc5mk6cu2",
  "cmtz8kt2b0081wubk2hgpx9be",
  "cmtz8kt2b0084wubkm8f058d0",
  "cmtz8kt2b008mwubkmw5fvmtw",
  "cmtz8kt2b008pwubkt0hzh852"
];

async function check7() {
  const p1File = fs.readFileSync(path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts"), "utf8");
  const p2File = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const precFile = fs.readFileSync(path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts"), "utf8");
  const b1CorrFile = fs.readFileSync(path.join(process.cwd(), "scripts/apply-50-batch-corrections.ts"), "utf8");

  const p1Matches = [...p1File.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  const p2FixIds = [...p2File.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  const precMatches = [...precFile.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
  const b1CorrIds = [...b1CorrFile.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);

  const allCoursesDb = await db.course.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, title: true, skill: { select: { name: true } } }
  });

  const p1p2FixSet = new Set([...p1Matches, ...p2FixIds]);
  const b1Courses = allCoursesDb.filter(c => !p1p2FixSet.has(c.id)).slice(0, 50);
  const b1Ids = b1Courses.map(c => c.id);

  const b2ExclusionSet = new Set([...p1Matches, ...p2FixIds, ...precMatches, ...b1CorrIds]);
  const b2Courses = allCoursesDb.filter(c => !b2ExclusionSet.has(c.id)).slice(0, 50);
  const b2Ids = b2Courses.map(c => c.id);

  console.log("Checking Known 7 IDs:");
  for (const id of KNOWN_7) {
    const idxInDb = allCoursesDb.findIndex(c => c.id === id);
    const inB1 = b1Ids.includes(id);
    const inB2 = b2Ids.includes(id);
    const course = allCoursesDb.find(c => c.id === id);
    console.log(`- [${id}] ("${course?.skill.name}"): Index in DB: ${idxInDb} | in B1: ${inB1} | in B2: ${inB2}`);
  }

  await db.$disconnect();
}

check7().catch(console.error);
