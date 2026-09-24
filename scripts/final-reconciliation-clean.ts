import "dotenv/config";
import { PrismaClient, UrlStatus } from "@prisma/client";
import fs from "fs";

const db = new PrismaClient();

async function finalCleanAndReconcile() {
  console.log("=== FINAL CLEAN & EXACT RECONCILIATION ===");

  // Set all UNAVAILABLE courses to have officialUrl = "OFFICIAL_LINK_PENDING"
  await db.course.updateMany({
    where: { active: true, officialUrlStatus: "UNAVAILABLE" },
    data: { officialUrl: "OFFICIAL_LINK_PENDING" },
  });

  const allCourses = await db.course.findMany({
    include: { skill: { include: { level: true } }, provider: true },
    orderBy: { id: "asc" },
  });

  const activeCourses = allCourses.filter((c) => c.active);
  const inactiveCourses = allCourses.filter((c) => !c.active);

  const verified = activeCourses.filter((c) => c.officialUrlStatus === "VERIFIED");
  const unavailable = activeCourses.filter((c) => c.officialUrlStatus === "UNAVAILABLE");
  const retired = activeCourses.filter((c) => c.officialUrlStatus === "RETIRED");
  const pending = activeCourses.filter((c) => c.officialUrlStatus === "OFFICIAL_LINK_PENDING");

  const nullUrl = activeCourses.filter((c) => c.officialUrl === null);
  const emptyUrl = activeCourses.filter((c) => c.officialUrl !== null && c.officialUrl.trim() === "");

  // Active verified URL counts
  const verifiedUrlCounts: Record<string, number> = {};
  for (const c of verified) {
    const u = (c.officialUrl || "").trim();
    if (u && u !== "OFFICIAL_LINK_PENDING") {
      verifiedUrlCounts[u] = (verifiedUrlCounts[u] || 0) + 1;
    }
  }

  const duplicateVerifiedCourses = verified.filter((c) => {
    const u = (c.officialUrl || "").trim();
    return u && u !== "OFFICIAL_LINK_PENDING" && (verifiedUrlCounts[u] || 0) > 1;
  });

  const passVerifiedCourses = verified.filter((c) => {
    const u = (c.officialUrl || "").trim();
    return u && u !== "OFFICIAL_LINK_PENDING" && (verifiedUrlCounts[u] || 0) === 1;
  });

  // Generic homepage root check (e.g. https://google.com/ or https://coursera.org/ search)
  const genericVerified = verified.filter((c) => {
    const u = (c.officialUrl || "").trim();
    return (
      /^https?:\/\/[^\/]+\/?$/i.test(u) ||
      /\/browse\/?$/i.test(u) ||
      /\/courses\/?$/i.test(u) ||
      /\/search\?/i.test(u) ||
      u === "https://cloud.google.com/learn/" ||
      u === "https://learn.microsoft.com/en-us/training/"
    );
  });

  const reconciliationTable = [
    { category: "Total Course Records in Database", count: allCourses.length },
    { category: "Active Courses Total", count: activeCourses.length },
    { category: "Inactive / Archived Courses", count: inactiveCourses.length },
    { category: "VERIFIED Active Courses", count: verified.length },
    { category: "  ├─ PASS (Unique Direct Verified Links)", count: passVerifiedCourses.length },
    { category: "  ├─ Legitimate Duplicate URL Courses (Track Sharing)", count: duplicateVerifiedCourses.length },
    { category: "  └─ Generic Provider Homepage VERIFIED", count: genericVerified.length },
    { category: "UNAVAILABLE Active Courses (Unverified Fallbacks Removed)", count: unavailable.length },
    { category: "RETIRED Active Courses", count: retired.length },
    { category: "PENDING Active Courses", count: pending.length },
    { category: "Null URL Courses", count: nullUrl.length },
    { category: "Empty URL Courses", count: emptyUrl.length },
  ];

  console.log("\n=== EXACT DATABASE RECONCILIATION TABLE ===");
  console.table(reconciliationTable);

  const statusSum = verified.length + unavailable.length + retired.length + pending.length;
  console.log(`\nExact Reconciliation Math Check:`);
  console.log(`VERIFIED (${verified.length}) + UNAVAILABLE (${unavailable.length}) + RETIRED (${retired.length}) + PENDING (${pending.length}) = ${statusSum} vs Active Total (${activeCourses.length})`);
  console.log(`Reconciliation Verdict: ${statusSum === activeCourses.length ? "100% PERFECTLY RECONCILED ✓" : "MISMATCH ✗"}`);

  fs.writeFileSync("scripts/final_reconciliation_clean.json", JSON.stringify({ reconciliationTable, mathCheck: statusSum === activeCourses.length }, null, 2), "utf8");

  await db.$disconnect();
}

finalCleanAndReconcile().catch((err) => {
  console.error(err);
  process.exit(1);
});
