import "dotenv/config";
import { PrismaClient, UrlStatus } from "@prisma/client";

const db = new PrismaClient();

/**
 * SOURCE-CODE CLEANUP & ENFORCEMENT SCRIPT
 * ========================================
 * Strict Quality Rules:
 * 1. NEVER automatically assign a generic provider homepage, badge, or fallback resource to an unrelated skill.
 * 2. If a course URL does not directly correspond to the exact course/topic, set officialUrlStatus = "UNAVAILABLE".
 * 3. officialUrlStatus = "VERIFIED" ONLY when the URL is HTTPS, reachable, and directly relevant to the course.
 */

async function main() {
  console.log("=== REMOVING GENERIC FALLBACK AUTOMATION IN SOURCE-CODE LOGIC ===");

  const activeCourses = await db.course.findMany({
    include: {
      skill: { include: { level: true } },
      provider: true,
    },
  });

  console.log(`Auditing ${activeCourses.length} active courses for generic fallback URLs...`);

  // Generic fallback URLs identified in legacy scripts
  const GENERIC_FALLBACK_URLS = new Set([
    "https://www.ibm.com/training/badge/enterprise-design-thinking-practitioner",
    "https://skillsforall.com/course/networking-essentials",
    "https://www.cloudskillsboost.google/course_templates/153",
    "https://cloud.google.com/learn/",
    "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/",
  ]);

  let updatedCount = 0;

  for (const c of activeCourses) {
    const url = (c.officialUrl || "").trim();
    if (GENERIC_FALLBACK_URLS.has(url)) {
      // Check if this course is ACTUALLY Enterprise Design Thinking, Networking Essentials, or Azure Fundamentals
      const sName = c.skill.name.toLowerCase();
      const cTitle = (c.title || c.name || "").toLowerCase();

      const isLegitimateIBM = url.includes("enterprise-design-thinking") && (sName.includes("design thinking") || cTitle.includes("design thinking"));
      const isLegitimateCisco = url.includes("networking-essentials") && (sName.includes("networking essentials") || cTitle.includes("networking essentials"));
      const isLegitimateAzure = url.includes("azure-fundamentals") && (sName.includes("azure fundamentals") || cTitle.includes("azure fundamentals"));

      if (!isLegitimateIBM && !isLegitimateCisco && !isLegitimateAzure) {
        // Unmark as VERIFIED, set to UNAVAILABLE until an authentic topic-specific URL is mapped
        await db.course.update({
          where: { id: c.id },
          data: {
            officialUrlStatus: UrlStatus.UNAVAILABLE,
          },
        });
        updatedCount++;
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} courses with generic fallback URLs to UNAVAILABLE.`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
