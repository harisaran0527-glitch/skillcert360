import "dotenv/config";
import { PrismaClient, UrlStatus } from "@prisma/client";

const db = new PrismaClient();

async function fixGenericLandingPages() {
  console.log("=== FIXING ALL REMAINING GENERIC LANDING PAGES ===");

  const activeVerified = await db.course.findMany({
    where: { active: true, officialUrlStatus: "VERIFIED" },
    include: { skill: { include: { level: true } }, provider: true },
  });

  let fixedCount = 0;

  for (const c of activeVerified) {
    const u = (c.officialUrl || "").trim();
    // Detect generic root / index landing pages
    const isGeneric =
      /^https?:\/\/[^\/]+\/?$/i.test(u) ||
      /\/browse\/?$/i.test(u) ||
      /\/courses\/?$/i.test(u) ||
      /\/search\?/i.test(u) ||
      /\/learn\/?$/i.test(u) ||
      /\/training\/?$/i.test(u) ||
      u === "https://cloud.google.com/learn/" ||
      u === "https://learn.microsoft.com/en-us/training/" ||
      u === "https://docs.docker.com/" ||
      u === "https://developer.mozilla.org/";

    if (isGeneric) {
      const sName = c.skill.name.toLowerCase();

      let specificUrl = "";
      if (sName.includes("javascript")) specificUrl = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide";
      else if (sName.includes("html") || sName.includes("css")) specificUrl = "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web";
      else if (sName.includes("docker")) specificUrl = "https://docs.docker.com/get-started/";
      else if (sName.includes("azure")) specificUrl = "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/";
      else if (sName.includes("gcp") || sName.includes("google cloud")) specificUrl = "https://www.cloudskillsboost.google/course_templates/153";

      if (specificUrl) {
        await db.course.update({
          where: { id: c.id },
          data: { officialUrl: specificUrl, officialUrlStatus: UrlStatus.VERIFIED },
        });
        console.log(`[FIXED] ${c.skill.name} (${c.skill.level.name}) -> ${specificUrl}`);
        fixedCount++;
      } else {
        // Unmark as VERIFIED, set to UNAVAILABLE with reason
        await db.course.update({
          where: { id: c.id },
          data: { officialUrl: "OFFICIAL_LINK_PENDING", officialUrlStatus: UrlStatus.UNAVAILABLE },
        });
        console.log(`[UNMARKED] ${c.skill.name} (${c.skill.level.name}) set to UNAVAILABLE`);
        fixedCount++;
      }
    }
  }

  console.log(`Successfully resolved ${fixedCount} generic landing page courses.`);
  await db.$disconnect();
}

fixGenericLandingPages().catch((err) => {
  console.error(err);
  process.exit(1);
});
