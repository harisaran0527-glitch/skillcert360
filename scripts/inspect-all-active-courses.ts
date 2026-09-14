import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const activeCourses = await db.course.findMany({
    where: { active: true },
    include: {
      skill: { include: { level: true, category: true } },
      provider: true,
    },
    orderBy: [{ skill: { level: { order: "asc" } } }, { skill: { name: "asc" } }, { id: "asc" }],
  });

  console.log(`Total Active Courses: ${activeCourses.length}`);

  const pending = activeCourses.filter(c => c.officialUrlStatus !== "VERIFIED");
  const noUrl = activeCourses.filter(c => !c.officialUrl || !c.officialUrl.trim());
  const invalidUrl = activeCourses.filter(c => c.officialUrl && !/^https?:\/\//i.test(c.officialUrl));

  console.log(`Pending / Non-Verified: ${pending.length}`);
  console.log(`No URL: ${noUrl.length}`);
  console.log(`Invalid URL Format: ${invalidUrl.length}`);

  console.log("\nDetails of Active Non-Verified or Problematic Courses:");
  for (const c of activeCourses) {
    const isPending = c.officialUrlStatus !== "VERIFIED";
    const url = (c.officialUrl || "").trim();
    const isGeneric = /\/(browse|search|docs|documentation|learn|courses|resources)\/?$/i.test(url) || /^https?:\/\/[^\/]+\/?$/i.test(url);
    const providerName = (c.provider?.name || "").toLowerCase();
    
    let providerMismatch = false;
    if (url) {
      try {
        const host = new URL(url).hostname.toLowerCase();
        if (providerName.includes("microsoft") && !host.includes("microsoft") && !host.includes("azure")) providerMismatch = true;
        if ((providerName.includes("aws") || providerName.includes("amazon")) && !host.includes("aws") && !host.includes("amazon")) providerMismatch = true;
        if (providerName.includes("google") && !host.includes("google") && !host.includes("coursera") && !host.includes("cloud.google")) providerMismatch = true;
      } catch (e) {
        providerMismatch = true;
      }
    }

    if (isPending || !url || isGeneric || providerMismatch) {
      console.log(`[${c.id}] Skill: "${c.skill.name}" (${c.skill.level.name}) | Provider: "${c.provider.name}" | Title: "${c.title || c.name}"`);
      console.log(`   URL: "${url}" | Status: ${c.officialUrlStatus}`);
      console.log(`   Flags: Pending=${isPending}, Missing=${!url}, Generic=${isGeneric}, Mismatch=${providerMismatch}\n`);
    }
  }

  await db.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
