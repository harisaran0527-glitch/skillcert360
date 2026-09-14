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

  console.log(`Total courses in database: ${courses.length}`);

  const urlCounts = new Map<string, number>();
  for (const c of courses) {
    if (c.officialUrl) {
      urlCounts.set(c.officialUrl, (urlCounts.get(c.officialUrl) || 0) + 1);
    }
  }

  const suspicious: any[] = [];
  const cleanVerified: any[] = [];

  for (const c of courses) {
    const url = c.officialUrl ? c.officialUrl.trim() : "";
    const status = c.officialUrlStatus || "";
    const providerName = (c.provider?.name || "").toLowerCase();
    const title = (c.title || "").toLowerCase();
    const skillName = (c.skill?.name || "").toLowerCase();

    let isSuspicious = false;
    const reasons: string[] = [];

    if (!url) {
      isSuspicious = true;
      reasons.push("Null or empty URL");
    }

    if (status === "OFFICIAL_LINK_PENDING") {
      isSuspicious = true;
      reasons.push("OFFICIAL_LINK_PENDING status");
    }

    // Generic homepages / search / browse pages / docs root
    const genericPatterns = [
      /\/browse\/?$/i,
      /\/search\/?$/i,
      /\/docs\/?$/i,
      /\/documentation\/?$/i,
      /^https?:\/\/[^\/]+\/?$/i, // domain root e.g. https://aws.amazon.com/
      /\/en-us\/training\/browse/i,
      /\/learn\/?$/i,
      /\/training\/?$/i,
      /\/courses\/?$/i,
      /\/resources\/?$/i,
    ];

    for (const pat of genericPatterns) {
      if (pat.test(url)) {
        isSuspicious = true;
        reasons.push(`Generic/browse/docs URL pattern matched: ${pat}`);
        break;
      }
    }

    // Domain mismatch check
    if (url) {
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        
        if (providerName.includes("microsoft") && !host.includes("microsoft") && !host.includes("azure")) {
          isSuspicious = true;
          reasons.push(`Provider mismatch: Provider '${c.provider.name}' but URL domain '${host}'`);
        } else if (providerName.includes("aws") || providerName.includes("amazon")) {
          if (!host.includes("aws") && !host.includes("amazon")) {
            isSuspicious = true;
            reasons.push(`Provider mismatch: Provider '${c.provider.name}' but URL domain '${host}'`);
          }
        } else if (providerName.includes("google")) {
          if (!host.includes("google") && !host.includes("coursera") && !host.includes("cloud.google")) {
            isSuspicious = true;
            reasons.push(`Provider mismatch: Provider '${c.provider.name}' but URL domain '${host}'`);
          }
        } else if (providerName.includes("cisco")) {
          if (!host.includes("cisco") && !host.includes("netacad")) {
            isSuspicious = true;
            reasons.push(`Provider mismatch: Provider '${c.provider.name}' but URL domain '${host}'`);
          }
        } else if (providerName.includes("oracle")) {
          if (!host.includes("oracle")) {
            isSuspicious = true;
            reasons.push(`Provider mismatch: Provider '${c.provider.name}' but URL domain '${host}'`);
          }
        } else if (providerName.includes("ibm")) {
          if (!host.includes("ibm") && !host.includes("skillsbuild") && !host.includes("coursera")) {
            isSuspicious = true;
            reasons.push(`Provider mismatch: Provider '${c.provider.name}' but URL domain '${host}'`);
          }
        }
      } catch (e) {
        isSuspicious = true;
        reasons.push(`Invalid URL format: ${url}`);
      }
    }

    // Reused URL across different skills
    if (url && (urlCounts.get(url) || 0) > 1) {
      const sameUrlCourses = courses.filter(other => other.officialUrl === url);
      const uniqueSkills = new Set(sameUrlCourses.map(other => other.skill.name));
      if (uniqueSkills.size > 1) {
        isSuspicious = true;
        reasons.push(`URL shared across ${uniqueSkills.size} different skills: ${Array.from(uniqueSkills).join(", ")}`);
      }
    }

    if (isSuspicious) {
      suspicious.push({
        id: c.id,
        title: c.title,
        skill: c.skill.name,
        provider: c.provider.name,
        url: c.officialUrl,
        status: c.officialUrlStatus,
        reasons
      });
    } else {
      cleanVerified.push(c);
    }
  }

  console.log(`\nScan complete:`);
  console.log(`Clean/verified records: ${cleanVerified.length}`);
  console.log(`Suspicious records: ${suspicious.length}`);

  console.log(`\nAll suspicious records list:`);
  suspicious.forEach((s, idx) => {
    console.log(`${idx + 1}. [${s.id}] Provider: "${s.provider}" | Skill: "${s.skill}" | Title: "${s.title}"`);
    console.log(`   URL: ${s.url}`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Reasons: ${s.reasons.join(" | ")}\n`);
  });

  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
