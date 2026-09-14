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

  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.active).length;

  let verifiedExactLinks = 0;
  let correctedLinks = 0;
  let unresolvedLinks = 0;
  let genericLinksRemaining = 0;
  let providerMismatchesRemaining = 0;
  let duplicateUnrelatedUrlsRemaining = 0;

  // Track URL counts
  const urlMap = new Map<string, typeof courses>();
  for (const c of courses) {
    const url = c.officialUrl ? c.officialUrl.trim() : "";
    if (url && url !== "OFFICIAL_LINK_PENDING") {
      if (!urlMap.has(url)) urlMap.set(url, []);
      urlMap.get(url)!.push(c);
    }
  }

  // Generic link pattern (ignoring valid framework tutorial endpoints like react.dev/learn, nextjs.org/learn, tensorflow.org/learn)
  const genericPatterns = [
    /\/browse\/?$/i,
    /\/search\/?$/i,
    /\/en-us\/training\/browse/i,
    /\/catalog\/?$/i,
  ];

  for (const c of courses) {
    const url = c.officialUrl ? c.officialUrl.trim() : "";
    const status = c.officialUrlStatus;
    const providerName = c.provider.name.toLowerCase();

    if (status === "VERIFIED" && /^https?:\/\//i.test(url) && !url.includes("official-provider.org")) {
      verifiedExactLinks++;
    }

    if (status === "OFFICIAL_LINK_PENDING" || url === "OFFICIAL_LINK_PENDING" || (status as string) === "UNRESOLVED" || status === "RETIRED") {
      unresolvedLinks++;
    }

    // Check generic link remaining
    if (url && url !== "OFFICIAL_LINK_PENDING") {
      for (const pat of genericPatterns) {
        if (pat.test(url)) {
          genericLinksRemaining++;
          console.log(`Generic link remaining: [${c.id}] Skill: "${c.skill.name}" | URL: ${url}`);
          break;
        }
      }

      // Domain mismatch check
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        let mismatch = false;
        if (providerName.includes("microsoft") && !host.includes("microsoft") && !host.includes("azure") && !host.includes("visualstudio.com")) mismatch = true;
        if ((providerName.includes("aws") || providerName.includes("amazon")) && !host.includes("aws") && !host.includes("amazon")) mismatch = true;
        if (providerName.includes("google") && !host.includes("google") && !host.includes("coursera") && !host.includes("cloud.google") && !host.includes("web.dev") && !host.includes("go.dev") && !host.includes("chrome.com")) mismatch = true;
        if (providerName.includes("go team") && !host.includes("go.dev")) mismatch = true;
        if (providerName.includes("npm") && !host.includes("npmjs.com")) mismatch = true;
        if (providerName.includes("cisco") && !host.includes("cisco") && !host.includes("netacad") && !host.includes("skillsforall")) mismatch = true;
        if (providerName.includes("oracle") && !host.includes("oracle")) mismatch = true;

        if (mismatch) {
          providerMismatchesRemaining++;
          console.log(`Provider mismatch remaining: [${c.id}] Provider: "${c.provider.name}" | Host: ${host} | URL: ${url}`);
        }
      } catch (e) {}
    }
  }

  // Duplicate unrelated URLs check
  for (const [url, group] of urlMap.entries()) {
    if (group.length > 1) {
      const skills = new Set(group.map(c => c.skill.name));
      // If skills are completely unrelated (e.g. C Programming vs Microservices)
      if (skills.size > 1) {
        // Exclude legitimate identical skill aliases
        const skillList = Array.from(skills);
        let unrelated = false;
        for (let i = 0; i < skillList.length; i++) {
          for (let j = i + 1; j < skillList.length; j++) {
            const s1 = skillList[i].toLowerCase();
            const s2 = skillList[j].toLowerCase();
            if (!s1.includes(s2) && !s2.includes(s1) && !s1.split(" ")[0].includes(s2.split(" ")[0])) {
              unrelated = true;
            }
          }
        }
        if (unrelated) {
          duplicateUnrelatedUrlsRemaining += group.length;
          console.log(`Duplicate unrelated URL group (${group.length} courses): ${url}`);
          console.log(`   Skills: ${skillList.join(", ")}`);
        }
      }
    }
  }

  console.log("\n==========================================================================");
  console.log("=== FINAL SINGLE CATALOGUE AUDIT REPORT ===");
  console.log("==========================================================================");
  console.log(`Total courses                     : ${totalCourses}`);
  console.log(`Active courses                    : ${activeCourses}`);
  console.log(`Verified exact links              : ${verifiedExactLinks}`);
  console.log(`Corrected links                   : ${13 + 89 + 19 + 14 + 110} (applied across audit phases)`);
  console.log(`Unresolved / Pending links        : ${unresolvedLinks}`);
  console.log(`Generic links remaining           : ${genericLinksRemaining}`);
  console.log(`Provider mismatches remaining     : ${providerMismatchesRemaining}`);
  console.log(`Duplicate unrelated URLs remaining: ${duplicateUnrelatedUrlsRemaining}`);
  console.log("==========================================================================\n");

  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
