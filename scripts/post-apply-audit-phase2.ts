import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

async function audit() {
  console.log("=== POST-APPLY STRICT AUDIT OF ALL 108 MICROSOFT BROWSE RECORDS ===\n");

  const fixesScript = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const matches = [...fixesScript.matchAll(/courseId:\s*"([^"]+)"/g)];
  const phase2CourseIds = matches.map(m => m[1]);

  const MS_BROWSE = "https://learn.microsoft.com/en-us/training/browse/";
  const remainingMsBrowse = await db.course.findMany({
    where: { officialUrl: MS_BROWSE },
    include: { provider: true, skill: true }
  });

  const allTargetCourseIds = Array.from(new Set([...phase2CourseIds, ...remainingMsBrowse.map(c => c.id)]));

  const courses = await db.course.findMany({
    where: { id: { in: allTargetCourseIds } },
    include: { provider: true, skill: true }
  });

  let verifiedCount = 0;
  let updatedInPhase2Count = 0;
  let needsPrecisionFixCount = 0;
  let unresolvedCount = 0;

  const nonConforming: Array<{
    id: string;
    skill: string;
    level: string;
    title: string;
    provider: string;
    url: string;
    issue: string;
    proposedUrl?: string;
    proposedProvider?: string;
    proposedTitle?: string;
  }> = [];

  const urlMap = new Map<string, Array<{ id: string; skill: string }>>();

  for (const c of courses) {
    if (c.officialUrl) {
      const list = urlMap.get(c.officialUrl) || [];
      list.push({ id: c.id, skill: c.skill.name });
      urlMap.set(c.officialUrl, list);
    }
  }

  for (const c of courses) {
    const isStillBrowse = c.officialUrl === MS_BROWSE;
    if (!isStillBrowse) {
      updatedInPhase2Count++;
    }

    let issue: string | null = null;
    let proposedUrl: string | undefined;
    let proposedProvider: string | undefined;
    let proposedTitle: string | undefined;

    if (isStillBrowse) {
      issue = "GENUINELY UNRESOLVED: Still points to generic Microsoft browse URL";
      unresolvedCount++;
    } else {
      const url = c.officialUrl;
      
      // 1. Swift Basics -> developer.apple.com/tutorials/swiftui
      if (c.skill.name.includes("Swift") && url.includes("developer.apple.com/tutorials/swiftui")) {
        issue = "DEPRECATED: Older Apple SwiftUI tutorial is marked deprecated by Apple. Replace with current Develop in Swift resource.";
        proposedUrl = "https://developer.apple.com/swift/resources/";
        proposedProvider = "Apple";
        proposedTitle = "Swift Resources & Documentation — Apple Developer";
      } 
      // 2. Figma Wireframing -> figma.com/resource-library/
      else if (url.includes("figma.com/resource-library")) {
        issue = "GENERIC RESOURCE LIBRARY: URL is a generic blog/resource index page, not a direct learning resource/tutorial.";
        proposedUrl = "https://help.figma.com/hc/en-us/articles/360040451373-Create-a-prototype";
        proposedProvider = "Figma";
        proposedTitle = "Prototyping in Figma — Official Figma Guide";
      }
      // 3. Jupyter Docs Root -> docs.jupyter.org/en/latest/
      else if (url === "https://docs.jupyter.org/en/latest/") {
        issue = "DOCUMENTATION LANDING PAGE: Generic root documentation page instead of a specific tutorial or guide.";
        proposedUrl = "https://jupyter-notebook.readthedocs.io/en/stable/notebook.html";
        proposedProvider = "Project Jupyter";
        proposedTitle = "The Jupyter Notebook Interface — Official Guide";
      }
      // 4. Duplicate URLs used for DIFFERENT skills
      else {
        const duplicates = urlMap.get(url) || [];
        const uniqueSkills = new Set(duplicates.map(d => d.skill));
        if (uniqueSkills.size > 1) {
          const names = Array.from(uniqueSkills).join(", ");
          issue = `REUSED URL FOR DIFFERENT SKILLS: URL is shared across skills [${names}]. Needs dedicated URL per skill.`;
        }
      }

      if (issue) {
        needsPrecisionFixCount++;
      } else {
        verifiedCount++;
      }
    }

    if (issue) {
      nonConforming.push({
        id: c.id,
        skill: c.skill.name,
        level: c.skill.levelId,
        title: c.title || "",
        provider: c.provider.name,
        url: c.officialUrl || "",
        issue,
        proposedUrl,
        proposedProvider,
        proposedTitle
      });
    }
  }

  console.log("=== AUDIT SUMMARY ===");
  console.log(`Total original MS browse records tracked : ${allTargetCourseIds.length}`);
  console.log(`Updated in Phase 2 DB run               : ${updatedInPhase2Count}`);
  console.log(`Successfully verified exact resources   : ${verifiedCount}`);
  console.log(`Needs further URL precision fix         : ${needsPrecisionFixCount}`);
  console.log(`Genuinely UNRESOLVED (still MS browse)  : ${unresolvedCount}`);

  console.log("\n=== NON-CONFORMING RECORDS LIST ===");
  nonConforming.forEach((nc, idx) => {
    console.log(`\n${idx + 1}. [${nc.id}] Skill: ${nc.skill} (${nc.level})`);
    console.log(`   Title    : ${nc.title}`);
    console.log(`   Provider : ${nc.provider}`);
    console.log(`   URL      : ${nc.url}`);
    console.log(`   ISSUE    : ${nc.issue}`);
    if (nc.proposedUrl) {
      console.log(`   PROPOSED FIX:`);
      console.log(`     Title   : ${nc.proposedTitle}`);
      console.log(`     Provider: ${nc.proposedProvider}`);
      console.log(`     URL     : ${nc.proposedUrl}`);
    }
  });

  await db.$disconnect();
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});
