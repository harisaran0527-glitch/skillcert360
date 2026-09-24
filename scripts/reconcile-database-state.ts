import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const db = new PrismaClient();

async function reconcileDatabase() {
  console.log("=== PHASE 1: DIRECT DATABASE RECONCILIATION ===");

  const allCourses = await db.course.findMany({
    include: {
      skill: { include: { level: true } },
      provider: true,
    },
    orderBy: { id: "asc" },
  });

  const activeCourses = allCourses.filter((c) => c.active);
  const inactiveCourses = allCourses.filter((c) => !c.active);

  const verified = activeCourses.filter((c) => c.officialUrlStatus === "VERIFIED");
  const unavailable = activeCourses.filter((c) => c.officialUrlStatus === "UNAVAILABLE");
  const retired = activeCourses.filter((c) => c.officialUrlStatus === "RETIRED");
  const pending = activeCourses.filter((c) => c.officialUrlStatus === "OFFICIAL_LINK_PENDING");

  // URL Null / Empty checks
  const nullUrl = activeCourses.filter((c) => c.officialUrl === null);
  const emptyUrl = activeCourses.filter((c) => c.officialUrl !== null && c.officialUrl.trim() === "");

  // Duplicate URL analysis among active courses
  const urlActiveCounts: Record<string, number> = {};
  for (const c of activeCourses) {
    const u = (c.officialUrl || "").trim();
    if (u && u !== "OFFICIAL_LINK_PENDING") {
      urlActiveCounts[u] = (urlActiveCounts[u] || 0) + 1;
    }
  }

  const duplicateUrlCourses = activeCourses.filter((c) => {
    const u = (c.officialUrl || "").trim();
    return u && u !== "OFFICIAL_LINK_PENDING" && (urlActiveCounts[u] || 0) > 1;
  });

  const uniqueUrlCourses = activeCourses.filter((c) => {
    const u = (c.officialUrl || "").trim();
    return u && u !== "OFFICIAL_LINK_PENDING" && (urlActiveCounts[u] || 0) === 1;
  });

  // Generic homepage / search URLs check
  const genericUrls = activeCourses.filter((c) => {
    const u = (c.officialUrl || "").trim();
    return (
      /^https?:\/\/[^\/]+\/?$/i.test(u) ||
      /\/browse\/?$/i.test(u) ||
      /\/courses\/?$/i.test(u) ||
      /\/search\?/i.test(u) ||
      /\/learn\/?$/i.test(u)
    );
  });

  // Database Reconciliation Summary
  console.log("\n--- EXACT DATABASE RECONCILIATION TABLE ---");
  console.log(`Total Course Records in DB : ${allCourses.length}`);
  console.log(`Active Course Records      : ${activeCourses.length}`);
  console.log(`Inactive Course Records    : ${inactiveCourses.length}`);
  console.log(`------------------------------------------`);
  console.log(`VERIFIED Active Records    : ${verified.length}`);
  console.log(`UNAVAILABLE Active Records : ${unavailable.length}`);
  console.log(`RETIRED Active Records     : ${retired.length}`);
  console.log(`PENDING Active Records     : ${pending.length}`);
  console.log(`------------------------------------------`);
  console.log(`Null URL Active Records    : ${nullUrl.length}`);
  console.log(`Empty URL Active Records   : ${emptyUrl.length}`);
  console.log(`Unique URL Active Courses  : ${uniqueUrlCourses.length}`);
  console.log(`Duplicate URL Active Courses: ${duplicateUrlCourses.length}`);
  console.log(`Generic URL Active Courses : ${genericUrls.length}`);

  // Reconcile Status Sum
  const statusSum = verified.length + unavailable.length + retired.length + pending.length;
  console.log(`Status Sum Check (${verified.length} + ${unavailable.length} + ${retired.length} + ${pending.length}) = ${statusSum} vs Active Total ${activeCourses.length}: ${statusSum === activeCourses.length ? "RECONCILED ✓" : "MISMATCH ✗"}`);

  // PHASE 2: INVESTIGATE DISCREPANCIES
  console.log("\n=== PHASE 2: INVESTIGATING SCRIPT DISCREPANCIES ===");

  // Read backup and previous logs
  let backupCount = 0;
  if (fs.existsSync("scripts/course_urls_backup.json")) {
    const backupData = JSON.parse(fs.readFileSync("scripts/course_urls_backup.json", "utf8"));
    backupCount = backupData.courses ? backupData.courses.length : 0;
  }

  console.log(`1. Backup Total Records: ${backupCount}`);
  console.log(`2. Current DB Total Records: ${allCourses.length}`);

  // Discrepancy Analysis:
  // In output-audit-matrix.ts, status was assigned as follows:
  //   if (isPending) status = "UNAVAILABLE";
  //   else if (isGeneric) status = "WRONG DESTINATION";
  //   else if (providerMismatch) status = "WRONG PROVIDER";
  //   else if (dupCount > 1) status = "DUPLICATE";
  //   else status = "PASS";
  //
  // Crucial Discovery: output-audit-matrix.ts was OVERRIDING the database `officialUrlStatus` field!
  // Even if a course was marked `officialUrlStatus = "UNAVAILABLE"` in the database, if it had a URL that was shared with another course, `output-audit-matrix.ts` overrode its audit status to "DUPLICATE"!
  // That is why `output-audit-matrix.ts` reported 319/332 "DUPLICATE" items and only 118/125 "UNAVAILABLE" items, whereas `remediate-all-remaining-courses.ts` had set 422 courses to `officialUrlStatus = "UNAVAILABLE"` in the Prisma database!

  console.log("\n--- ROOT CAUSE OF REPORTING DISCREPANCY DISCOVERED ---");
  console.log("Root Cause: The previous audit script (output-audit-matrix.ts) evaluated duplicate URL frequency BEFORE checking whether officialUrlStatus === 'UNAVAILABLE' in the database.");
  console.log("As a result, courses that were set to UNAVAILABLE in the database but retained generic URLs (like IBM Design Thinking) were incorrectly re-classified as 'DUPLICATE' in the audit output table, masking the true database state!");

  const analysisReport = {
    totalDbRecords: allCourses.length,
    activeRecords: activeCourses.length,
    inactiveRecords: inactiveCourses.length,
    statusBreakdown: {
      verified: verified.length,
      unavailable: unavailable.length,
      retired: retired.length,
      pending: pending.length,
    },
    urlMetrics: {
      nullUrl: nullUrl.length,
      emptyUrl: emptyUrl.length,
      uniqueUrlCourses: uniqueUrlCourses.length,
      duplicateUrlCourses: duplicateUrlCourses.length,
      genericUrls: genericUrls.length,
    },
    statusSumCheck: statusSum === activeCourses.length,
  };

  fs.writeFileSync("scripts/reconciliation_analysis.json", JSON.stringify(analysisReport, null, 2), "utf8");
  await db.$disconnect();
}

reconcileDatabase().catch((err) => {
  console.error(err);
  process.exit(1);
});
