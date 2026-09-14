import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("=== SCANNING & FIXING SUSPICIOUS COURSE CATALOGUE RECORDS DIRECTLY ===");

  const courses = await db.course.findMany({
    include: {
      skill: true,
      provider: true
    },
    orderBy: { id: "asc" }
  });

  console.log(`Total courses in database: ${courses.length}`);

  let updatedCount = 0;
  let verifiedCount = 0;
  let pendingCount = 0;

  for (const c of courses) {
    const url = c.officialUrl ? c.officialUrl.trim() : "";
    const status = c.officialUrlStatus;
    const skillName = c.skill.name;

    let shouldUpdateToPending = false;
    let updateReason = "";

    // 1. Generic MS Browse URL
    if (url === "https://learn.microsoft.com/en-us/training/browse/" || url.includes("/training/browse")) {
      shouldUpdateToPending = true;
      updateReason = "Generic MS Browse URL";
    }

    // 2. Generic IBM SkillsBuild URL
    else if (url === "https://skillsbuild.org/learn" || url === "https://skillsbuild.org/learn/cybersecurity" || url.includes("skillsbuild.org/learn")) {
      shouldUpdateToPending = true;
      updateReason = "Generic IBM SkillsBuild landing page";
    }

    // 3. Generic Google Cloud Skills Boost Paths
    else if (url.includes("cloudskillsboost.google/paths")) {
      if (skillName !== "Google Cloud Professional Data Engineer" && skillName !== "Data Engineering & ETL Pipelines" && skillName !== "Prompt Flow & Evaluation") {
        shouldUpdateToPending = true;
        updateReason = "Generic Google Cloud Skills Boost /paths landing page";
      }
    }

    // 4. Generic AWS Catalog URL
    else if (url === "https://explore.skillbuilder.aws/learn/catalog" || url.includes("skillbuilder.aws/learn/catalog")) {
      shouldUpdateToPending = true;
      updateReason = "Generic AWS SkillBuilder /catalog landing page";
    }

    // 5. Generic Cisco CyberOps URL (for non-CyberOps skills)
    else if (url.includes("netacad.com/courses/cybersecurity/cyberops-associate")) {
      if (skillName !== "SOC Analyst Procedures") {
        shouldUpdateToPending = true;
        updateReason = "Generic Cisco CyberOps link reused for non-cyberops skill";
      }
    }

    // 6. Generic Red Hat RHCSA URL (for non-RHCSA skills)
    else if (url.includes("redhat.com/en/services/certification/rhcsa")) {
      if (skillName !== "Linux System Administration") {
        shouldUpdateToPending = true;
        updateReason = "Generic RHCSA link reused for non-RHCSA skill";
      }
    }

    // 7. Generic Cisco CCNP Enterprise URL (for non-matching skills)
    else if (url.includes("ccnp-enterprise.html")) {
      if (skillName !== "Enterprise Network Engineering (CCNP)" && skillName !== "Enterprise Network Architecture (CCIE Level)") {
        shouldUpdateToPending = true;
        updateReason = "Generic Cisco CCNP page reused for unrelated skill";
      }
    }

    // 5. Generic Salesforce Administrator URL (for non-matching skills)
    else if (url.includes("trailhead.salesforce.com/en/credentials/administrator")) {
      if (skillName !== "Salesforce Admin Development") {
        shouldUpdateToPending = true;
        updateReason = "Generic Salesforce Admin link reused for non-admin skill";
      }
    }

    // 6. Generic AWS ML Specialty Plan (for non-ML specific skills)
    else if (url.includes("elearning/12471/aws-certified-machine-learning-specialty-learning-plan")) {
      if (skillName !== "Machine Learning Engineering & MLOps" && skillName !== "AI Engineering & Fine-Tuning") {
        shouldUpdateToPending = true;
        updateReason = "Generic AWS ML Specialty plan reused for unrelated skill";
      }
    }

    // 8. Reused Microsoft Web Dev 101 URL (for non-Web Dev 101 skills)
    else if (url.includes("web-development-101")) {
      if (skillName !== "JavaScript" && skillName !== "Web Development") {
        shouldUpdateToPending = true;
        updateReason = "Reused Web Development 101 URL for specific framework/skill";
      }
    }

    // 9. Reused Oracle Database Foundations URL (for non-Oracle skills like MySQL/PostgreSQL/SQLite)
    else if (url.includes("oracle-database-foundations")) {
      if (skillName !== "Database Administration" && skillName !== "Oracle Database") {
        shouldUpdateToPending = true;
        updateReason = "Reused Oracle DB Foundations URL for non-Oracle database";
      }
    }

    // 10. Reused AWS Cloud Practitioner URL (for non-AWS skills like GCP, Cloud Storage, etc.)
    else if (url.includes("aws-cloud-practitioner-essentials")) {
      if (skillName !== "Cloud Computing Fundamentals" && skillName !== "AWS Fundamentals" && skillName !== "AWS Cloud Practitioner Basics") {
        shouldUpdateToPending = true;
        updateReason = "Reused AWS Cloud Practitioner URL for GCP/non-AWS skill";
      }
    }

    // 11. Reused Cisco SkillsForAll Linux Essentials URL (for Bash, PowerShell, etc.)
    else if (url.includes("skillsforall.com/course/linux-essentials")) {
      if (skillName !== "Linux Command Line Fundamentals" && skillName !== "Linux Essentials") {
        shouldUpdateToPending = true;
        updateReason = "Reused Linux Essentials URL for specific shell/automation skill";
      }
    }

    // 12. Reused Cisco SkillsForAll Networking Basics URL
    else if (url.includes("skillsforall.com/course/networking-basics")) {
      if (skillName !== "Network Protocol Essentials" && skillName !== "Networking Fundamentals") {
        shouldUpdateToPending = true;
        updateReason = "Reused Networking Basics URL for specific subnetting/wireless skill";
      }
    }

    // 13. Reused Cisco SkillsForAll Intro to Cybersecurity URL
    else if (url.includes("skillsforall.com/course/introduction-to-cybersecurity")) {
      if (skillName !== "Cyber Hygiene Basics" && skillName !== "Cybersecurity Fundamentals") {
        shouldUpdateToPending = true;
        updateReason = "Reused Intro to Cybersecurity URL for specific OWASP/Hacking skill";
      }
    }

    // 14. Reused UiPath Automation Developer URL
    else if (url.includes("uipath.com/learning-plans/automation-developer-associate-training")) {
      if (skillName !== "UiPath Studio RPA Development" && skillName !== "Robotic Process Automation Intro") {
        shouldUpdateToPending = true;
        updateReason = "Reused UiPath Automation URL for non-UiPath skill";
      }
    }

    // 15. Reused Postman Student Expert URL
    else if (url.includes("academy.postman.com/student-expert")) {
      if (skillName !== "Postman API Testing Basics" && skillName !== "Postman API Client Basics") {
        shouldUpdateToPending = true;
        updateReason = "Reused Postman Student Expert URL for GraphQL/REST concepts";
      }
    }

    // 16. Synthetic / Fake URLs
    else if (url.includes("official-provider.org")) {
      shouldUpdateToPending = true;
      updateReason = "Synthetic domain official-provider.org";
    }

    // 17. Generic Linux Foundation root
    else if (url === "https://training.linuxfoundation.org/" || url === "https://training.linuxfoundation.org") {
      shouldUpdateToPending = true;
      updateReason = "Generic Linux Foundation homepage root";
    }

    if (shouldUpdateToPending) {
      await db.course.update({
        where: { id: c.id },
        data: {
          officialUrl: "OFFICIAL_LINK_PENDING",
          officialUrlStatus: "OFFICIAL_LINK_PENDING"
        }
      });
      updatedCount++;
      console.log(`[UPDATED] [${c.id}] Skill: "${skillName}" -> Set to OFFICIAL_LINK_PENDING (${updateReason})`);
    }
  }

  console.log(`\nUpdated ${updatedCount} suspicious records to OFFICIAL_LINK_PENDING.`);

  // FINAL STATS
  const finalCourses = await db.course.findMany({
    include: { skill: true, provider: true }
  });

  let totalCourses = finalCourses.length;
  let activeCourses = finalCourses.filter(c => c.active).length;
  let verifiedExactLinks = finalCourses.filter(c => c.officialUrlStatus === "VERIFIED" && /^https?:\/\//i.test(c.officialUrl) && !c.officialUrl.includes("official-provider.org")).length;
  let pendingLinks = finalCourses.filter(c => c.officialUrlStatus === "OFFICIAL_LINK_PENDING" || c.officialUrl === "OFFICIAL_LINK_PENDING").length;

  console.log("\n==================================================");
  console.log("FINAL CATALOGUE AUDIT METRICS");
  console.log("==================================================");
  console.log(`Total courses             : ${totalCourses}`);
  console.log(`Active courses            : ${activeCourses}`);
  console.log(`Verified exact links      : ${verifiedExactLinks}`);
  console.log(`Unresolved / Pending links: ${pendingLinks}`);
  console.log("==================================================\n");

  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
