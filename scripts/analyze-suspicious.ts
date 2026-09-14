import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const courses = await db.course.findMany({
    include: {
      skill: true,
      provider: true
    },
    orderBy: { id: "asc" }
  });

  const urlCounts = new Map<string, number>();
  for (const c of courses) {
    if (c.officialUrl) {
      urlCounts.set(c.officialUrl, (urlCounts.get(c.officialUrl) || 0) + 1);
    }
  }

  // Count by URL category / pattern
  const categories = {
    msBrowse: 0, // https://learn.microsoft.com/en-us/training/browse/
    skillsbuildLearn: 0, // https://skillsbuild.org/learn
    googleBoostPath16: 0, // https://www.cloudskillsboost.google/paths/16
    ciscoCcnp: 0, // ccnp-enterprise.html
    pending: 0,
    nullUrl: 0,
    otherGeneric: 0,
    domainMismatch: 0,
  };

  const msBrowseRecords: any[] = [];
  const skillsbuildLearnRecords: any[] = [];
  const googleBoostPath16Records: any[] = [];
  const ciscoCcnpRecords: any[] = [];
  const pendingRecords: any[] = [];

  const urlGroupMap = new Map<string, typeof courses>();
  for (const c of courses) {
    const url = c.officialUrl || "(NULL)";
    if (!urlGroupMap.has(url)) {
      urlGroupMap.set(url, []);
    }
    urlGroupMap.get(url)!.push(c);
  }

  console.log(`\n==================================================`);
  console.log(`SUSPICIOUS URL GROUPS (count > 1 or suspicious rule matched)`);
  console.log(`==================================================\n`);

  let suspiciousGroupCount = 0;
  let suspiciousCourseTotal = 0;

  const sortedGroups = Array.from(urlGroupMap.entries()).sort((a, b) => b[1].length - a[1].length);

  for (const [url, group] of sortedGroups) {
    const isShared = group.length > 1;
    const isGeneric = /\/browse\/?$/i.test(url) || /\/search\/?$/i.test(url) || /\/docs\/?$/i.test(url) || /\/learn\/?$/i.test(url) || /^https?:\/\/[^\/]+\/?$/i.test(url);
    const isPending = group.some(c => c.officialUrlStatus === "OFFICIAL_LINK_PENDING");
    const isRetired = group.some(c => c.officialUrlStatus === "RETIRED");
    const isSynthetic = url.includes("official-provider.org");

    if (isShared || isGeneric || isPending || isRetired || isSynthetic) {
      suspiciousGroupCount++;
      suspiciousCourseTotal += group.length;
      console.log(`URL: ${url}`);
      console.log(`Count: ${group.length} | Providers: ${Array.from(new Set(group.map(c => c.provider.name))).join(", ")} | Statuses: ${Array.from(new Set(group.map(c => c.officialUrlStatus))).join(", ")}`);
      console.log(`Skills: ${group.map(c => c.skill.name).join(", ")}\n`);
    }
  }

  console.log(`Total suspicious groups: ${suspiciousGroupCount}`);
  console.log(`Total suspicious courses affected: ${suspiciousCourseTotal}`);

  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
