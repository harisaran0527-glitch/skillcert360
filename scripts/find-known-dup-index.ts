import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function findIndex() {
  const knownDupId = "cmtz8kt2b0082wubkod0ymp4k";

  const allCourses = await db.course.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, officialUrl: true, createdAt: true }
  });

  const index = allCourses.findIndex(c => c.id === knownDupId);
  console.log(`knownDupId (${knownDupId}) index in allCourses (orderBy createdAt asc): ${index} / ${allCourses.length}`);
  if (index !== -1) {
    console.log(`Course details:`, allCourses[index]);
  }
  await db.$disconnect();
}

findIndex().catch(console.error);
