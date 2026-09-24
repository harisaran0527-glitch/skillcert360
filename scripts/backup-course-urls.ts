import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const db = new PrismaClient();

async function backup() {
  console.log("=== BACKING UP COURSE TABLE URL MAPPINGS ===");
  const courses = await db.course.findMany({
    include: {
      skill: { select: { id: true, name: true, slug: true } },
      provider: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { id: "asc" },
  });

  const backupData = {
    timestamp: new Date().toISOString(),
    totalRecords: courses.length,
    courses,
  };

  fs.writeFileSync("scripts/course_urls_backup.json", JSON.stringify(backupData, null, 2), "utf8");
  console.log(`Backup completed successfully. Saved ${courses.length} records to scripts/course_urls_backup.json`);
  await db.$disconnect();
}

backup().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
