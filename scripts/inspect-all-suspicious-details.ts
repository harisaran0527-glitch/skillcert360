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

  const genericUrlGroups = new Map<string, any[]>();
  const singleSuspicious: any[] = [];

  for (const c of courses) {
    const url = c.officialUrl ? c.officialUrl.trim() : "";
    const count = urlCounts.get(url) || 0;
    const isGenericPattern = /\/browse\/?$/i.test(url) || /\/search\/?$/i.test(url) || /\/docs\/?$/i.test(url) || /\/learn\/?$/i.test(url) || /^https?:\/\/[^\/]+\/?$/i.test(url) || url.includes("official-provider.org");

    if (count > 1 || isGenericPattern || c.officialUrlStatus === "OFFICIAL_LINK_PENDING") {
      if (!genericUrlGroups.has(url)) {
        genericUrlGroups.set(url, []);
      }
      genericUrlGroups.get(url)!.push(c);
    }
  }

  console.log(`Found ${genericUrlGroups.size} generic/shared URL groups:\n`);

  for (const [url, list] of genericUrlGroups.entries()) {
    console.log(`URL (${list.length} courses): ${url}`);
    console.log(`Provider(s): ${Array.from(new Set(list.map(c => c.provider.name))).join(", ")}`);
    console.log(`Courses:`);
    list.forEach(c => {
      console.log(`  - [${c.id}] Skill: "${c.skill.name}" | Title: "${c.title}" | Status: ${c.officialUrlStatus}`);
    });
    console.log("");
  }

  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
