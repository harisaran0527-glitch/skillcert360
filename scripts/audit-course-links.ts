import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function audit() {
  const courses = await db.course.findMany({
    where: { active: true },
    include: {
      skill: { select: { name: true, slug: true, level: { select: { name: true } } } },
      provider: { select: { name: true, slug: true } },
    },
    orderBy: [{ skill: { name: "asc" } }, { name: "asc" }],
  });

  console.log(`=== AUDITING ${courses.length} ACTIVE/VISIBLE COURSES ===\n`);

  let pendingCount = 0;
  let verifiedCount = 0;
  let invalidUrlCount = 0;
  let mismatchCount = 0;

  for (const c of courses) {
    const isPending = c.officialUrlStatus === "OFFICIAL_LINK_PENDING";
    if (isPending) pendingCount++;
    else if (c.officialUrlStatus === "VERIFIED") verifiedCount++;

    let urlValid = true;
    try {
      new URL(c.officialUrl);
    } catch {
      urlValid = false;
      invalidUrlCount++;
    }

    // Check for obvious mismatches: e.g. coursera homepage or mismatched names
    const isHomepage = c.officialUrl.endsWith("coursera.org/") || c.officialUrl === "https://coursera.org" || c.officialUrl.endsWith("microsoft.com/") || c.officialUrl.endsWith("aws.amazon.com/");
    
    console.log(`[${c.officialUrlStatus}] ${c.skill.name} (${c.skill.level.name}) | Course: "${c.name}" | Provider: ${c.provider.name}`);
    console.log(`  URL: ${c.officialUrl}`);
    if (isHomepage) {
      console.log(`  ⚠️ MISMATCH / GENERIC HOMEPAGE LINK!`);
      mismatchCount++;
    }
    console.log("");
  }

  console.log("=== AUDIT SUMMARY ===");
  console.log(`Total Active Courses: ${courses.length}`);
  console.log(`Verified Status: ${verifiedCount}`);
  console.log(`Pending Status: ${pendingCount}`);
  console.log(`Invalid URLs: ${invalidUrlCount}`);
  console.log(`Generic/Mismatched URLs: ${mismatchCount}`);
}

audit()
  .catch((err) => console.error(err))
  .finally(() => db.$disconnect());
