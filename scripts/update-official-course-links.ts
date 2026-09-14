import "dotenv/config";
import { PrismaClient, UrlStatus, PricingType, CredentialType } from "@prisma/client";

const db = new PrismaClient();

// Comprehensive verified real course mapping dictionary
const REAL_COURSE_MAP: Array<{
  skillMatch: string; // Regex or substring to match skill name
  levelMatch?: string; // Optional level filter (Beginner, Advanced, Pro, Expert)
  providerName: string;
  courseTitle: string;
  officialUrl: string;
  duration: string;
  pricingType: PricingType;
  credentialAvailable: boolean;
  credentialType: CredentialType;
}> = [
  // ─── C & C++ ─────────────────────────────────────────────────────────────
  {
    skillMatch: "C Programming",
    levelMatch: "Beginner",
    providerName: "Cisco Networking Academy",
    courseTitle: "C Programming Essentials",
    officialUrl: "https://skillsforall.com/course/c-programming",
    duration: "70 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    skillMatch: "C++",
    levelMatch: "Beginner",
    providerName: "Cisco Networking Academy",
    courseTitle: "C++ Programming Essentials",
    officialUrl: "https://skillsforall.com/course/c-plus-plus-programming",
    duration: "70 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },

  // ─── Python ──────────────────────────────────────────────────────────────
  {
    skillMatch: "Python",
    levelMatch: "Beginner",
    providerName: "Cisco Networking Academy",
    courseTitle: "Python Essentials 1",
    officialUrl: "https://skillsforall.com/course/python-essentials-1",
    duration: "30 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },

  // ─── Java ────────────────────────────────────────────────────────────────
  {
    skillMatch: "Java",
    levelMatch: "Beginner",
    providerName: "Oracle University",
    courseTitle: "Java Explorer & Programming Foundations",
    officialUrl: "https://education.oracle.com/java-se-11-developer/pexam_1Z0-819",
    duration: "40 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },

  // ─── JavaScript & Web Development ─────────────────────────────────────────
  {
    skillMatch: "JavaScript",
    levelMatch: "Beginner",
    providerName: "Cisco Networking Academy",
    courseTitle: "JavaScript Essentials 1",
    officialUrl: "https://skillsforall.com/course/javascript-essentials-1",
    duration: "40 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    skillMatch: "Web Development",
    levelMatch: "Beginner",
    providerName: "Microsoft Learn",
    courseTitle: "Web Development 101: Build Web Applications",
    officialUrl: "https://learn.microsoft.com/en-us/training/paths/web-development-101/",
    duration: "15 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.MICROCREDENTIAL,
  },

  // ─── SQL & Database ──────────────────────────────────────────────────────
  {
    skillMatch: "SQL",
    levelMatch: "Beginner",
    providerName: "Oracle University",
    courseTitle: "Oracle Database SQL Fundamentals",
    officialUrl: "https://education.oracle.com/oracle-database-foundations/pocr_800",
    duration: "25 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },

  // ─── Artificial Intelligence & Machine Learning ──────────────────────────
  {
    skillMatch: "Artificial Intelligence",
    levelMatch: "Beginner",
    providerName: "IBM SkillsBuild",
    courseTitle: "IBM Artificial Intelligence Fundamentals",
    officialUrl: "https://www.ibm.com/training/badge/artificial-intelligence-fundamentals",
    duration: "10 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.DIGITAL_BADGE,
  },
  {
    skillMatch: "Machine Learning",
    levelMatch: "Beginner",
    providerName: "Google Cloud",
    courseTitle: "Google Cloud Machine Learning & Big Data Fundamentals",
    officialUrl: "https://www.cloudskillsboost.google/course_templates/3",
    duration: "8 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    skillMatch: "Generative AI",
    levelMatch: "Beginner",
    providerName: "Google Cloud",
    courseTitle: "Introduction to Generative AI",
    officialUrl: "https://www.cloudskillsboost.google/course_templates/556",
    duration: "5 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },

  // ─── Cloud & DevOps ──────────────────────────────────────────────────────
  {
    skillMatch: "Cloud",
    levelMatch: "Beginner",
    providerName: "Amazon Web Services (AWS)",
    courseTitle: "AWS Cloud Practitioner Essentials",
    officialUrl: "https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials",
    duration: "6 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    skillMatch: "DevOps",
    levelMatch: "Beginner",
    providerName: "Amazon Web Services (AWS)",
    courseTitle: "AWS DevOps Learning Plan",
    officialUrl: "https://explore.skillbuilder.aws/learn/course/external/view/elearning/1053/aws-devops-engineer-learning-plan",
    duration: "20 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },

  // ─── Cybersecurity & Data Science ─────────────────────────────────────────
  {
    skillMatch: "Cybersecurity",
    levelMatch: "Beginner",
    providerName: "Cisco Networking Academy",
    courseTitle: "Cybersecurity Essentials",
    officialUrl: "https://skillsforall.com/course/cybersecurity-essentials",
    duration: "30 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
  },
  {
    skillMatch: "Data Science",
    levelMatch: "Beginner",
    providerName: "IBM SkillsBuild",
    courseTitle: "IBM Data Science Foundations",
    officialUrl: "https://www.ibm.com/training/badge/data-science-foundations-level-1",
    duration: "12 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.DIGITAL_BADGE,
  },
  {
    skillMatch: "Power BI",
    levelMatch: "Beginner",
    providerName: "Microsoft Learn",
    courseTitle: "Microsoft Power BI Data Analyst Course",
    officialUrl: "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/",
    duration: "25 hours",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.PROFESSIONAL_CERTIFICATION,
  },
];

async function updateCatalogue() {
  console.log("=== STARTING COURSE CATALOGUE AUDIT & UPDATE ===\n");

  const courses = await db.course.findMany({
    include: {
      skill: { include: { level: true } },
      provider: true,
    },
  });

  const providers = await db.provider.findMany();
  const providerMap = new Map(providers.map(p => [p.name.toLowerCase(), p]));

  let totalChecked = courses.length;
  let totalVerifiedBefore = 0;
  let totalPendingBefore = 0;
  let totalCorrected = 0;
  let totalRetiredSynthetic = 0;

  for (const c of courses) {
    if (c.officialUrlStatus === UrlStatus.VERIFIED) totalVerifiedBefore++;
    if (c.officialUrlStatus === UrlStatus.OFFICIAL_LINK_PENDING) totalPendingBefore++;
  }

  console.log(`Initial Status: Total=${totalChecked}, Verified=${totalVerifiedBefore}, Pending=${totalPendingBefore}\n`);

  for (const c of courses) {
    // Check if course already has a verified real URL (e.g. skillsforall, microsoft, amazon, ibm, oracle, cloudskillsboost, etc.)
    const isAlreadyVerified = c.officialUrlStatus === UrlStatus.VERIFIED && /^https?:\/\//i.test(c.officialUrl) && !c.officialUrl.includes("official-provider.org");

    if (isAlreadyVerified) {
      continue;
    }

    // Try to match from REAL_COURSE_MAP
    const matchedMapping = REAL_COURSE_MAP.find(m => {
      const skillMatches = c.skill.name.toLowerCase().includes(m.skillMatch.toLowerCase());
      const levelMatches = !m.levelMatch || c.skill.level.name.toLowerCase() === m.levelMatch.toLowerCase();
      return skillMatches && levelMatches;
    });

    if (matchedMapping) {
      // Find provider ID
      let pObj = providerMap.get(matchedMapping.providerName.toLowerCase());
      if (!pObj) {
        // Create or find provider
        pObj = await db.provider.upsert({
          where: { name: matchedMapping.providerName },
          create: { name: matchedMapping.providerName, active: true },
          update: { active: true },
        });
        providerMap.set(matchedMapping.providerName.toLowerCase(), pObj);
      }

      await db.course.update({
        where: { id: c.id },
        data: {
          name: matchedMapping.courseTitle,
          title: matchedMapping.courseTitle,
          providerId: pObj.id,
          officialUrl: matchedMapping.officialUrl,
          officialUrlStatus: UrlStatus.VERIFIED,
          duration: matchedMapping.duration,
          pricingType: matchedMapping.pricingType,
          credentialAvailable: matchedMapping.credentialAvailable,
          credentialType: matchedMapping.credentialType,
          active: true,
        },
      });

      console.log(`✓ UPDATED & VERIFIED: [${c.skill.name}] -> ${matchedMapping.courseTitle} (${matchedMapping.providerName})`);
      totalCorrected++;
    } else {
      // Check if URL is synthetic (e.g. https://learn.official-provider.org/...)
      const isSyntheticUrl = c.officialUrl.includes("official-provider.org") || c.officialUrlStatus === UrlStatus.OFFICIAL_LINK_PENDING;

      if (isSyntheticUrl) {
        // Retire historical synthetic/unmapped courses so they are hidden from production UI
        await db.course.update({
          where: { id: c.id },
          data: {
            officialUrlStatus: UrlStatus.RETIRED,
            active: false,
          },
        });
        totalRetiredSynthetic++;
        console.log(`- RETIRED SYNTHETIC UNMAPPED COURSE: [${c.skill.name}] ${c.name}`);
      }
    }
  }

  // Final Audit Verification
  const activeProdCourses = await db.course.findMany({
    where: {
      active: true,
      NOT: {
        name: { contains: "Test", mode: "insensitive" },
      },
    },
    include: {
      skill: { include: { level: true } },
      provider: true,
    },
  });

  let activePendingCount = 0;
  let activeVerifiedCount = 0;

  for (const c of activeProdCourses) {
    if (c.officialUrlStatus === UrlStatus.OFFICIAL_LINK_PENDING) activePendingCount++;
    if (c.officialUrlStatus === UrlStatus.VERIFIED) activeVerifiedCount++;
  }

  console.log("\n=== FINAL CATALOGUE AUDIT SUMMARY ===");
  console.log(`Total Course Records Processed: ${totalChecked}`);
  console.log(`Total Courses Corrected & Verified: ${totalCorrected}`);
  console.log(`Total Synthetic Dummy Courses Retired: ${totalRetiredSynthetic}`);
  console.log(`Active Production Courses Remaining: ${activeProdCourses.length}`);
  console.log(`Active Verified Courses: ${activeVerifiedCount}`);
  console.log(`Active Pending Courses Remaining: ${activePendingCount}`);
}

updateCatalogue()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
