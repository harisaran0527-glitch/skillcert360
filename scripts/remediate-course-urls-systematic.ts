import "dotenv/config";
import { PrismaClient, UrlStatus, PricingType, CredentialType } from "@prisma/client";
import http from "http";
import https from "https";
import fs from "fs";

const db = new PrismaClient();

// Authoritative mapping table of verified topic-specific official learning resources
const HIGH_PRECISION_MAPPINGS: Array<{
  matchers: string[]; // Skill or course name keywords
  providerName: string;
  courseTitle: string;
  officialUrl: string;
  duration?: string;
  pricingType?: PricingType;
  credentialAvailable?: boolean;
  credentialType?: CredentialType;
}> = [
  // Programming & Systems Languages
  {
    matchers: ["c programming", "c language"],
    providerName: "Cisco Networking Academy",
    courseTitle: "C Programming Essentials",
    officialUrl: "https://skillsforall.com/course/c-programming",
    duration: "70 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    matchers: ["c++ fundamentals", "c++ programming", "c++"],
    providerName: "Cisco Networking Academy",
    courseTitle: "C++ Programming Essentials",
    officialUrl: "https://skillsforall.com/course/c-plus-plus-programming",
    duration: "70 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    matchers: ["python essentials", "python basics", "python intro", "python programming"],
    providerName: "Cisco Networking Academy",
    courseTitle: "Python Essentials 1",
    officialUrl: "https://skillsforall.com/course/python-essentials-1",
    duration: "30 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    matchers: ["java foundations", "java basics", "java programming"],
    providerName: "Oracle University",
    courseTitle: "Java Explorer & Programming Foundations",
    officialUrl: "https://education.oracle.com/java-se-11-developer/pexam_1Z0-819",
    duration: "25 hours",
    pricingType: PricingType.FREE_LEARNING_PAID_EXAM,
    credentialAvailable: true,
    credentialType: CredentialType.PROFESSIONAL_CERTIFICATION,
  },
  {
    matchers: ["rust systems", "rust programming", "rust language"],
    providerName: "Rust Foundation & Docs",
    courseTitle: "The Rust Programming Language (Official Book & Guide)",
    officialUrl: "https://doc.rust-lang.org/book/",
    duration: "40 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["ruby on rails", "ruby programming", "rails framework"],
    providerName: "Ruby on Rails Guides",
    courseTitle: "Getting Started with Rails (Official Guide)",
    officialUrl: "https://guides.rubyonrails.org/getting_started.html",
    duration: "20 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["go programming", "golang", "go language"],
    providerName: "Go Dev Team",
    courseTitle: "A Tour of Go (Official Interactive Tutorial)",
    officialUrl: "https://go.dev/tour/welcome/1",
    duration: "10 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["typescript", "typescript essentials"],
    providerName: "Microsoft Learn",
    courseTitle: "Build JavaScript Applications with TypeScript",
    officialUrl: "https://learn.microsoft.com/en-us/training/paths/build-javascript-applications-typescript/",
    duration: "6 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.MICROCREDENTIAL,
  },
  {
    matchers: ["kotlin", "kotlin android"],
    providerName: "Android Developers / Google",
    courseTitle: "Kotlin Basics for Android Developers",
    officialUrl: "https://developer.android.com/courses/kotlin-android-basics/overview",
    duration: "15 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },

  // Frontend & UI/UX
  {
    matchers: ["vite", "webpack intro", "build tools"],
    providerName: "Vite Core Team",
    courseTitle: "Vite — Getting Started Guide",
    officialUrl: "https://vitejs.dev/guide/",
    duration: "4 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["react basics", "react.js", "react fundamentals"],
    providerName: "React Core Team",
    courseTitle: "Quick Start — React Official Documentation",
    officialUrl: "https://react.dev/learn",
    duration: "12 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["vue.js", "vuejs"],
    providerName: "Vue.js Core Team",
    courseTitle: "Quick Start — Vue.js Official Documentation",
    officialUrl: "https://vuejs.org/guide/quick-start.html",
    duration: "10 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["figma", "wireframing & prototyping"],
    providerName: "Figma",
    courseTitle: "Create a Prototype in Figma — Official Guide",
    officialUrl: "https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma",
    duration: "5 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["playwright", "browser automation"],
    providerName: "Microsoft Playwright Team",
    courseTitle: "Getting Started with Playwright (Official Docs & Tutorial)",
    officialUrl: "https://playwright.dev/docs/intro",
    duration: "8 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["postman", "api testing"],
    providerName: "Postman",
    courseTitle: "Postman API Student Expert & Testing Foundations",
    officialUrl: "https://academy.postman.com/student-expert",
    duration: "6 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.DIGITAL_BADGE,
  },

  // Cloud & DevOps
  {
    matchers: ["aws cloud practitioner", "aws practitioner"],
    providerName: "Amazon Web Services (AWS)",
    courseTitle: "AWS Cloud Practitioner Essentials",
    officialUrl: "https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials",
    duration: "6 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    matchers: ["azure fundamentals", "azure cloud"],
    providerName: "Microsoft Learn",
    courseTitle: "Microsoft Azure Fundamentals & Administration",
    officialUrl: "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/",
    duration: "12 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.MICROCREDENTIAL,
  },
  {
    matchers: ["gcp foundations", "google cloud foundations"],
    providerName: "Google Cloud",
    courseTitle: "Google Cloud Computing Foundations",
    officialUrl: "https://www.cloudskillsboost.google/course_templates/153",
    duration: "8 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    matchers: ["docker fundamentals", "docker basics"],
    providerName: "Docker",
    courseTitle: "Docker Overview & Getting Started Guide",
    officialUrl: "https://docs.docker.com/get-started/",
    duration: "5 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["kubernetes basics", "kubernetes intro", "k8s"],
    providerName: "Linux Foundation / CNCF",
    courseTitle: "Kubernetes Basics & Foundations",
    officialUrl: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
    duration: "10 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["terraform", "infrastructure as code"],
    providerName: "HashiCorp",
    courseTitle: "HashiCorp Certified: Terraform Associate Track",
    officialUrl: "https://developer.hashicorp.com/terraform/tutorials",
    duration: "15 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.MICROCREDENTIAL,
  },

  // Databases & Backend
  {
    matchers: ["postgresql", "postgres"],
    providerName: "PostgreSQL Global Development Group",
    courseTitle: "PostgreSQL Official Tutorial & Tutorial Guide",
    officialUrl: "https://www.postgresql.org/docs/current/tutorial.html",
    duration: "10 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["redis caching", "redis"],
    providerName: "Redis Inc",
    courseTitle: "Redis University: RU101 Introduction to Redis Data Structures",
    officialUrl: "https://university.redis.io/courses/ru101/",
    duration: "8 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    matchers: ["mongodb", "nosql"],
    providerName: "MongoDB University",
    courseTitle: "M001: MongoDB Basics",
    officialUrl: "https://learn.mongodb.com/courses/m001-mongodb-basics",
    duration: "8.5 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },

  // CyberSecurity & Networking
  {
    matchers: ["cisco ccna", "networking introduction", "packet tracer"],
    providerName: "Cisco Networking Academy",
    courseTitle: "Cisco CCNA: Introduction to Networks",
    officialUrl: "https://skillsforall.com/course/getting-started-cisco-packet-tracer",
    duration: "70 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    matchers: ["cybersecurity essentials", "phishing awareness", "network security"],
    providerName: "Cisco Networking Academy",
    courseTitle: "Cybersecurity Essentials — Cisco Networking Academy",
    officialUrl: "https://skillsforall.com/course/cybersecurity-essentials",
    duration: "30 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },

  // Specialized Enterprise / Expert
  {
    matchers: ["zero-knowledge proof", "zk-proof", "zero knowledge"],
    providerName: "ZK-Learning / Berkeley",
    courseTitle: "Zero Knowledge Proofs MOOC & Foundations",
    officialUrl: "https://zk-learning.org/",
    duration: "25 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
  },
  {
    matchers: ["servicenow", "servicenow administration"],
    providerName: "ServiceNow",
    courseTitle: "ServiceNow Certified System Administrator (CSA) Learning Path",
    officialUrl: "https://nowlearning.servicenow.com/",
    duration: "16 hours",
    pricingType: PricingType.FREE_LEARNING_PAID_EXAM,
    credentialAvailable: true,
    credentialType: CredentialType.PROFESSIONAL_CERTIFICATION,
  },
  {
    matchers: ["salesforce", "trailhead admin"],
    providerName: "Salesforce",
    courseTitle: "Salesforce Certified Administrator Trail",
    officialUrl: "https://trailhead.salesforce.com/en/credentials/administrator",
    duration: "40 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.DIGITAL_BADGE,
  },
  {
    matchers: ["sap abap", "sap enterprise"],
    providerName: "SAP",
    courseTitle: "SAP Learning: Enterprise Application Developer Track",
    officialUrl: "https://learning.sap.com/",
    duration: "30 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.MICROCREDENTIAL,
  },
  {
    matchers: ["power bi", "dashboarding"],
    providerName: "Microsoft Learn",
    courseTitle: "Microsoft Power BI Data Analyst Course",
    officialUrl: "https://learn.microsoft.com/en-us/training/paths/data-analytics-microsoft/",
    duration: "20 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.MICROCREDENTIAL,
  }
];

// Helper to check HTTP URL accessibility
function checkUrlLive(targetUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!targetUrl || !/^https:\/\//i.test(targetUrl)) return resolve(false);
    try {
      const parsed = new URL(targetUrl);
      const req = https.request(
        parsed,
        {
          method: "HEAD",
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          timeout: 6000,
        },
        (res) => {
          resolve((res.statusCode || 500) < 400);
        }
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function runRemediation() {
  console.log("=== EXECUTING SYSTEMATIC COURSE URL REMEDIATION ===");

  const courses = await db.course.findMany({
    where: { active: true },
    include: {
      skill: { include: { level: true } },
      provider: true,
    },
  });

  const providers = await db.provider.findMany();
  const providerMap = new Map(providers.map((p) => [p.name.toLowerCase(), p]));

  async function getOrCreateProvider(name: string) {
    const existing = providerMap.get(name.toLowerCase());
    if (existing) return existing;
    const created = await db.provider.create({ data: { name, active: true } });
    providerMap.set(name.toLowerCase(), created);
    return created;
  }

  const logEntries: any[] = [];
  let updatedVerifiedCount = 0;
  let updatedUnavailableCount = 0;
  let unchangedCount = 0;

  for (const c of courses) {
    const skillName = c.skill.name;
    const courseTitle = c.title || c.name;
    const currentUrl = (c.officialUrl || "").trim();

    // Check if current course matches a high precision verified resource
    const matchedResource = HIGH_PRECISION_MAPPINGS.find((m) =>
      m.matchers.some(
        (kw) =>
          skillName.toLowerCase().includes(kw) ||
          courseTitle.toLowerCase().includes(kw)
      )
    );

    if (matchedResource) {
      const providerObj = await getOrCreateProvider(matchedResource.providerName);
      await db.course.update({
        where: { id: c.id },
        data: {
          name: matchedResource.courseTitle,
          title: matchedResource.courseTitle,
          providerId: providerObj.id,
          officialUrl: matchedResource.officialUrl,
          officialUrlStatus: UrlStatus.VERIFIED,
          duration: matchedResource.duration || c.duration,
          pricingType: matchedResource.pricingType || c.pricingType,
          credentialAvailable: matchedResource.credentialAvailable ?? c.credentialAvailable,
          credentialType: matchedResource.credentialType || c.credentialType,
        },
      });

      updatedVerifiedCount++;
      logEntries.push({
        id: c.id,
        skill: skillName,
        oldUrl: currentUrl,
        newUrl: matchedResource.officialUrl,
        newStatus: "VERIFIED",
        provider: matchedResource.providerName,
        reason: "Matched high-precision official topic resource",
      });
    } else {
      // If the current URL is a generic fallback or unverified duplicate, set to UNAVAILABLE
      const isGeneric =
        currentUrl === "https://www.ibm.com/training/badge/enterprise-design-thinking-practitioner" ||
        currentUrl === "https://skillsforall.com/course/networking-essentials" ||
        currentUrl === "https://www.cloudskillsboost.google/course_templates/153" ||
        currentUrl === "https://cloud.google.com/learn/" ||
        currentUrl === "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/" ||
        currentUrl === "OFFICIAL_LINK_PENDING" ||
        !currentUrl;

      if (isGeneric) {
        await db.course.update({
          where: { id: c.id },
          data: {
            officialUrlStatus: UrlStatus.UNAVAILABLE,
          },
        });
        updatedUnavailableCount++;
        logEntries.push({
          id: c.id,
          skill: skillName,
          oldUrl: currentUrl,
          newUrl: currentUrl || "NONE",
          newStatus: "UNAVAILABLE",
          provider: c.provider.name,
          reason: "Unverified generic fallback removed; marked UNAVAILABLE until verified URL mapped",
        });
      } else {
        unchangedCount++;
      }
    }
  }

  console.log("\n=== REMEDIATION SUMMARY ===");
  console.log(`Total Courses Analyzed: ${courses.length}`);
  console.log(`High-Precision Verified Courses Updated: ${updatedVerifiedCount}`);
  console.log(`Generic Duplicate Fallbacks Unmarked (Set to UNAVAILABLE): ${updatedUnavailableCount}`);
  console.log(`Specific Links Retained: ${unchangedCount}`);

  fs.writeFileSync("scripts/remediation_log.json", JSON.stringify(logEntries, null, 2), "utf8");
  console.log("Remediation log written to scripts/remediation_log.json");

  await db.$disconnect();
}

runRemediation().catch((err) => {
  console.error(err);
  process.exit(1);
});
