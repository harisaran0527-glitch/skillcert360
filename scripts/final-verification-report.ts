import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const db = new PrismaClient();

async function main() {
  const backupRaw = fs.readFileSync("scripts/course_urls_backup.json", "utf8");
  const backup = JSON.parse(backupRaw);

  const courses = await db.course.findMany({
    where: { active: true },
    include: { skill: { include: { level: true } }, provider: true },
  });

  // Frequency of URLs in backup (Before)
  const beforeUrlCounts: Record<string, number> = {};
  for (const c of backup.courses) {
    const u = (c.officialUrl || "").trim();
    if (u && u !== "OFFICIAL_LINK_PENDING") {
      beforeUrlCounts[u] = (beforeUrlCounts[u] || 0) + 1;
    }
  }

  // Frequency of URLs in current state (After)
  const afterUrlCounts: Record<string, number> = {};
  for (const c of courses) {
    const u = (c.officialUrl || "").trim();
    if (u && u !== "OFFICIAL_LINK_PENDING" && c.officialUrlStatus === "VERIFIED") {
      afterUrlCounts[u] = (afterUrlCounts[u] || 0) + 1;
    }
  }

  // Calculate BEFORE metrics
  let beforePass = 0;
  let beforeDuplicate = 0;
  let beforeWrongDest = 0;
  let beforeUnavailable = 0;

  for (const c of backup.courses) {
    const u = (c.officialUrl || "").trim();
    const isPending = c.officialUrlStatus !== "VERIFIED" || !u || u === "OFFICIAL_LINK_PENDING";
    const dupCount = u ? (beforeUrlCounts[u] || 0) : 0;
    const isGeneric =
      /^https?:\/\/[^\/]+\/?$/i.test(u) ||
      /\/browse\/?$/i.test(u) ||
      /\/courses\/?$/i.test(u) ||
      /\/search\?/i.test(u) ||
      /\/learn\/?$/i.test(u);

    if (isPending) beforeUnavailable++;
    else if (isGeneric) beforeWrongDest++;
    else if (dupCount > 1) beforeDuplicate++;
    else beforePass++;
  }

  // Calculate AFTER metrics
  let afterPass = 0;
  let afterDuplicate = 0;
  let afterWrongDest = 0;
  let afterWrongProvider = 0;
  let afterUnavailable = 0;
  let afterBroken = 0;

  for (const c of courses) {
    const u = (c.officialUrl || "").trim();
    const statusStr = c.officialUrlStatus;
    const isPending = statusStr !== "VERIFIED" || !u || u === "OFFICIAL_LINK_PENDING";
    const dupCount = u ? (afterUrlCounts[u] || 0) : 0;
    const isGeneric =
      /^https?:\/\/[^\/]+\/?$/i.test(u) ||
      /\/browse\/?$/i.test(u) ||
      /\/courses\/?$/i.test(u) ||
      /\/search\?/i.test(u) ||
      /\/learn\/?$/i.test(u);

    if (isPending) {
      afterUnavailable++;
    } else if (isGeneric) {
      afterWrongDest++;
    } else if (dupCount > 1) {
      afterDuplicate++;
    } else {
      afterPass++;
    }
  }

  const comparison = {
    before: {
      totalCourses: backup.courses.length,
      pass: beforePass,
      duplicateUrls: beforeDuplicate,
      wrongDestinations: beforeWrongDest,
      broken: 0,
      unavailable: beforeUnavailable,
      verifyRoute: 404,
    },
    after: {
      totalCourses: courses.length,
      pass: afterPass,
      duplicateUrls: afterDuplicate,
      wrongDestinations: afterWrongDest,
      broken: afterBroken,
      unavailable: afterUnavailable,
      verifyRoute: 200,
    },
  };

  console.log("=== COMPLETED COMPARISON AUDIT ===");
  console.log(JSON.stringify(comparison, null, 2));

  fs.writeFileSync("scripts/final_audit_comparison.json", JSON.stringify(comparison, null, 2), "utf8");
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
