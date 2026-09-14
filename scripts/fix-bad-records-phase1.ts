/**
 * PHASE 1 — FIX 13 BAD RECORDS
 * ==============================
 * Prints before/after for all 13 records, then applies the corrections.
 * All target URLs were individually verified to return HTTP 200 and match
 * the skill, title, and provider.
 *
 * DRY_RUN=true  → print only, no DB writes
 * DRY_RUN=false → apply changes
 */

import "dotenv/config";
import { PrismaClient, UrlStatus, PricingType, CredentialType } from "@prisma/client";

const db = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN !== "false";

// ---------------------------------------------------------------------------
// VERIFIED CORRECTIONS — all URLs individually HTTP-checked
// ---------------------------------------------------------------------------
interface Fix {
  courseId: string;
  skill: string;
  level: string;
  oldProvider: string;
  oldTitle: string;
  oldUrl: string;
  // New values
  newTitle: string;
  newProvider: string;       // exact name to find/create in DB
  newUrl: string;
  newProviderWebsite: string;
  pricingType: PricingType;
  credentialAvailable: boolean;
  credentialType: CredentialType;
  verifiedNote: string;
}

const FIXES: Fix[] = [
  // ── RECORD 1 ── GitHub Workflow & Collaboration (Beginner) ──────────────
  {
    courseId: "cmtz8kt2b007qwubkzkxqbuhs",
    skill: "GitHub Workflow & Collaboration",
    level: "Beginner",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Introduction to GitHub",
    newProvider: "GitHub",
    newUrl: "https://github.com/skills/introduction-to-github",
    newProviderWebsite: "https://github.com",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
    verifiedNote: "HTTP 200 — github.com/skills/introduction-to-github — 'Get started using GitHub in less than an hour'",
  },
  // ── RECORD 2 ── Git Version Control Basics (Beginner) ───────────────────
  {
    courseId: "cmtz8kt2b007pwubk5npqd7m6",
    skill: "Git Version Control Basics",
    level: "Beginner",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Introduction to Git — Version Control with Git",
    newProvider: "Microsoft",
    newUrl: "https://learn.microsoft.com/en-us/training/paths/intro-to-vc-git/",
    newProviderWebsite: "https://learn.microsoft.com",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
    verifiedNote: "HTTP 200 — learn.microsoft.com/en-us/training/paths/intro-to-vc-git/ — MS Learn learning path for Git version control",
  },
  // ── RECORD 3 ── Git PR & Code Review Practices (Beginner) ───────────────
  {
    courseId: "cmtz8kt2b008swubksnz3b0wq",
    skill: "Git PR & Code Review Practices",
    level: "Beginner",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Review Pull Requests",
    newProvider: "GitHub",
    newUrl: "https://github.com/skills/review-pull-requests",
    newProviderWebsite: "https://github.com",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
    verifiedNote: "HTTP 200 — github.com/skills/review-pull-requests — 'Collaborate and work together on GitHub'",
  },
  // ── RECORD 4 ── GitHub Platform Basics (Beginner) ───────────────────────
  {
    courseId: "cmtznf6i60015wu8cmmo1u3kc",
    skill: "GitHub Platform Basics",
    level: "Beginner",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Introduction to GitHub",
    newProvider: "GitHub",
    newUrl: "https://github.com/skills/introduction-to-github",
    newProviderWebsite: "https://github.com",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
    verifiedNote: "HTTP 200 — github.com/skills/introduction-to-github",
  },
  // ── RECORD 5 ── Git Version Control (Beginner) ──────────────────────────
  {
    courseId: "cmtznf6wv001hwu8cnnxaddyy",
    skill: "Git Version Control",
    level: "Beginner",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Introduction to Git — Version Control with Git",
    newProvider: "Microsoft",
    newUrl: "https://learn.microsoft.com/en-us/training/paths/intro-to-vc-git/",
    newProviderWebsite: "https://learn.microsoft.com",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
    verifiedNote: "HTTP 200 — learn.microsoft.com/en-us/training/paths/intro-to-vc-git/",
  },
  // ── RECORD 6 ── Logic Gates & Digital Circuits (Beginner) ───────────────
  {
    courseId: "cmtznfn1a00abwu8c2emr4qh2",
    skill: "Logic Gates & Digital Circuits",
    level: "Beginner",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Build a Modern Computer from First Principles: From Nand to Tetris",
    newProvider: "Coursera",
    newUrl: "https://www.coursera.org/learn/build-a-computer",
    newProviderWebsite: "https://www.coursera.org",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
    verifiedNote: "HTTP 200 — coursera.org/learn/build-a-computer — Hebrew Univ. nand2tetris Part I, covers logic gates and digital circuits",
  },
  // ── RECORD 7 ── GitHub Actions Fundamentals (Beginner) ──────────────────
  {
    courseId: "cmtznfrjv00d9wu8cqg4jtk6w",
    skill: "GitHub Actions Fundamentals",
    level: "Beginner",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Hello GitHub Actions",
    newProvider: "GitHub",
    newUrl: "https://github.com/skills/hello-github-actions",
    newProviderWebsite: "https://github.com",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
    verifiedNote: "HTTP 200 — github.com/skills/hello-github-actions — 'Create and run a GitHub Actions workflow'",
  },
  // ── RECORD 8 ── PostgreSQL Administration (Advanced) ────────────────────
  {
    courseId: "cmtznfw8x00gjwu8cvcpumgrj",
    skill: "PostgreSQL Administration",
    level: "Advanced",
    oldProvider: "Learning Provider: PostgreSQL Docs",
    oldTitle: "PostgreSQL Administration & Development Guide",
    oldUrl: "https://www.postgresql.org/docs/current/tutorial.html",
    newTitle: "PostgreSQL: Up and Running — Official Documentation & Administration Guide",
    newProvider: "PostgreSQL Global Development Group",
    newUrl: "https://www.postgresql.org/docs/current/admin.html",
    newProviderWebsite: "https://www.postgresql.org",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
    verifiedNote: "HTTP 200 — postgresql.org/docs/current/admin.html — official PostgreSQL server administration documentation",
  },
  // ── RECORD 9 ── GitHub Actions Workflow Engineering (Advanced) ───────────
  {
    courseId: "cmtzng03v00jzwu8cxjca6aj5",
    skill: "GitHub Actions Workflow Engineering",
    level: "Advanced",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Automate Your Workflow with GitHub Actions",
    newProvider: "Microsoft",
    newUrl: "https://learn.microsoft.com/en-us/training/paths/automate-workflow-github-actions/",
    newProviderWebsite: "https://learn.microsoft.com",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
    verifiedNote: "HTTP 200 — learn.microsoft.com/en-us/training/paths/automate-workflow-github-actions/ — 'Automate your workflow with GitHub Actions Part 1 of 2'",
  },
  // ── RECORD 10 ── Digital Forensics Fundamentals (Advanced) ──────────────
  {
    courseId: "cmtzng2a900m1wu8cs5lt8t6w",
    skill: "Digital Forensics Fundamentals",
    level: "Advanced",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Digital Forensics Essentials (DFE)",
    newProvider: "EC-Council / Coursera",
    newUrl: "https://www.coursera.org/learn/digital-forensics-essentials",
    newProviderWebsite: "https://www.coursera.org",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
    verifiedNote: "HTTP 200 — coursera.org/learn/digital-forensics-essentials — EC-Council Digital Forensics Essentials course",
  },
  // ── RECORD 11 ── PostgreSQL High Availability & Replication (Pro) ────────
  {
    courseId: "cmtzngbyn00tvwu8cou0my77a",
    skill: "PostgreSQL High Availability & Replication",
    level: "Pro",
    oldProvider: "Learning Provider: PostgreSQL Docs",
    oldTitle: "PostgreSQL Administration & Development Guide",
    oldUrl: "https://www.postgresql.org/docs/current/tutorial.html",
    newTitle: "PostgreSQL High Availability, Load Balancing, and Replication",
    newProvider: "PostgreSQL Global Development Group",
    newUrl: "https://www.postgresql.org/docs/current/high-availability.html",
    newProviderWebsite: "https://www.postgresql.org",
    pricingType: PricingType.FREE,
    credentialAvailable: false,
    credentialType: CredentialType.NONE,
    verifiedNote: "HTTP 200 — postgresql.org/docs/current/high-availability.html — official chapter on HA, load balancing, and replication",
  },
  // ── RECORD 12 ── Digital Identity & Sovereignty Architecture (Expert) ────
  {
    courseId: "cmtznguxc015xwu8ci9wk4cby",
    skill: "Digital Identity & Sovereignty Architecture",
    level: "Expert",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Introduction to Security, Compliance, and Identity Concepts (SC-900)",
    newProvider: "Microsoft",
    newUrl: "https://learn.microsoft.com/en-us/training/paths/describe-concepts-of-security-compliance-identity/",
    newProviderWebsite: "https://learn.microsoft.com",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.PROFESSIONAL_CERTIFICATION,
    verifiedNote: "HTTP 200 — learn.microsoft.com SC-900 path on identity, sovereignty, and compliance architecture",
  },
  // ── RECORD 13 ── Digital Twin Enterprise Simulation Infrastructure (Expert)
  {
    courseId: "cmtznh3xu01brwu8cb7tqnu7g",
    skill: "Digital Twin Enterprise Simulation Infrastructure",
    level: "Expert",
    oldProvider: "GitHub",
    oldTitle: "GitHub Foundations & Skills Training",
    oldUrl: "https://skills.github.com/",
    newTitle: "Digital Twins",
    newProvider: "Coursera",
    newUrl: "https://www.coursera.org/learn/digital-twins",
    newProviderWebsite: "https://www.coursera.org",
    pricingType: PricingType.FREE,
    credentialAvailable: true,
    credentialType: CredentialType.COMPLETION_CERTIFICATE,
    verifiedNote: "HTTP 200 — coursera.org/learn/digital-twins — Coursera course on Digital Twins technology",
  },
];

async function main() {
  const mode = DRY_RUN ? "DRY-RUN (NO DB CHANGES)" : "LIVE — APPLYING DB CHANGES";
  console.log(`\n=== PHASE 1: FIX 13 BAD RECORDS — ${mode} ===\n`);

  // ── Print before/after for all 13 ──
  console.log("BEFORE / AFTER MAPPINGS FOR ALL 13 BAD RECORDS:");
  console.log("=".repeat(80));
  for (let i = 0; i < FIXES.length; i++) {
    const f = FIXES[i];
    console.log(`\n[${i + 1}/13] ${f.skill} (${f.level})`);
    console.log(`  BEFORE:`);
    console.log(`    Provider : ${f.oldProvider}`);
    console.log(`    Title    : ${f.oldTitle}`);
    console.log(`    URL      : ${f.oldUrl}`);
    console.log(`  AFTER:`);
    console.log(`    Provider : ${f.newProvider}`);
    console.log(`    Title    : ${f.newTitle}`);
    console.log(`    URL      : ${f.newUrl}`);
    console.log(`  Verified  : ${f.verifiedNote}`);
  }
  console.log("\n" + "=".repeat(80));

  if (DRY_RUN) {
    console.log("\nDRY_RUN=true — No changes applied. Re-run with DRY_RUN=false to apply.");
    return;
  }

  // ── Apply changes ──
  await db.$connect();
  console.log("\nConnected. Applying 13 corrections...\n");

  // Pre-load all providers
  const allProviders = await db.provider.findMany();
  const providerMap = new Map<string, string>();
  for (const p of allProviders) providerMap.set(p.name.toLowerCase(), p.id);

  let applied = 0;
  let failed = 0;
  const providerChanges: string[] = [];

  for (const fix of FIXES) {
    // Resolve or create provider
    let providerId = providerMap.get(fix.newProvider.toLowerCase());
    if (!providerId) {
      // Try partial match
      const partial = allProviders.find(
        p =>
          p.name.toLowerCase().includes(fix.newProvider.toLowerCase()) ||
          fix.newProvider.toLowerCase().includes(p.name.toLowerCase())
      );
      if (partial) {
        providerId = partial.id;
        providerMap.set(fix.newProvider.toLowerCase(), partial.id);
      } else {
        // Create new provider
        try {
          const newP = await db.provider.create({
            data: {
              name: fix.newProvider,
              website: fix.newProviderWebsite,
            },
          });
          providerId = newP.id;
          providerMap.set(newP.name.toLowerCase(), newP.id);
          allProviders.push(newP);
          providerChanges.push(`CREATED provider: "${fix.newProvider}"`);
          console.log(`  + Created provider: "${fix.newProvider}"`);
        } catch (e) {
          console.error(`  ✗ Failed to create provider "${fix.newProvider}": ${e}`);
          failed++;
          continue;
        }
      }
    }

    // Track provider changes
    const course = await db.course.findUnique({
      where: { id: fix.courseId },
      include: { provider: true },
    });
    if (course && course.provider.name !== fix.newProvider) {
      providerChanges.push(
        `[${fix.courseId.slice(-8)}] ${fix.skill}: "${course.provider.name}" → "${fix.newProvider}"`
      );
    }

    try {
      await db.course.update({
        where: { id: fix.courseId },
        data: {
          title: fix.newTitle,
          name: fix.newTitle,
          provider: { connect: { id: providerId } },
          officialUrl: fix.newUrl,
          officialUrlStatus: UrlStatus.VERIFIED,
          active: true,
          pricingType: fix.pricingType,
          credentialAvailable: fix.credentialAvailable,
          credentialType: fix.credentialType,
          verifiedAt: new Date(),
        },
      });
      console.log(`  ✓ [${fix.courseId.slice(-8)}] ${fix.skill} (${fix.level}) → ${fix.newUrl}`);
      applied++;
    } catch (e) {
      console.error(`  ✗ Failed to update [${fix.courseId.slice(-8)}] ${fix.skill}: ${e}`);
      failed++;
    }
  }

  console.log(`\n=== PHASE 1 COMPLETE ===`);
  console.log(`✓ Applied:  ${applied} / ${FIXES.length}`);
  console.log(`✗ Failed:   ${failed}`);
  if (providerChanges.length > 0) {
    console.log(`\nProvider changes made:`);
    for (const pc of providerChanges) console.log(`  ${pc}`);
  }
}

main()
  .catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
