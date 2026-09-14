import { db } from "../src/lib/db";

async function auditCourseLinks() {
  console.log("=== AUDITING ALL COURSE OFFICIAL URLS ===");

  const courses = await db.course.findMany({
    select: {
      id: true,
      officialUrl: true,
      officialUrlStatus: true,
    },
  });

  console.log(`Total Courses in Database: ${courses.length}`);

  let verifiedCount = 0;
  let pendingCount = 0;

  const toVerify: string[] = [];
  const toPending: string[] = [];

  for (const course of courses) {
    const url = course.officialUrl;
    const isPlaceholder =
      !url ||
      url.includes("official-provider.org") ||
      url.includes("example.com") ||
      url.endsWith("/dashboard") ||
      url.endsWith("/home") ||
      url === "https://learn.microsoft.com" ||
      url === "https://aws.amazon.com" ||
      url === "https://netacad.com" ||
      url === "https://cloudskillsboost.google";

    const isDeepLink =
      /^https?:\/\//i.test(url) &&
      !isPlaceholder &&
      (url.includes("/courses/") ||
        url.includes("/training/") ||
        url.includes("/learn/") ||
        url.includes("/paths/") ||
        url.includes("/credentials/") ||
        url.includes("/modules/") ||
        url.includes("/certifications/") ||
        url.split("/").length > 4);

    if (isDeepLink) {
      verifiedCount++;
      toVerify.push(course.id);
    } else {
      pendingCount++;
      toPending.push(course.id);
    }
  }

  // Batch update
  if (toVerify.length > 0) {
    await db.course.updateMany({
      where: { id: { in: toVerify } },
      data: { officialUrlStatus: "VERIFIED" },
    });
  }

  if (toPending.length > 0) {
    await db.course.updateMany({
      where: { id: { in: toPending } },
      data: { officialUrlStatus: "OFFICIAL_LINK_PENDING" },
    });
  }

  console.log(`\nURL Audit Summary:`);
  console.log(`  - VERIFIED Official Course Deep Links: ${verifiedCount}`);
  console.log(`  - OFFICIAL_LINK_PENDING (Action button disabled/flagged): ${pendingCount}`);

  process.exit(0);
}

auditCourseLinks().catch((err) => {
  console.error("Course link audit failed:", err);
  process.exit(1);
});
