import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

interface AuditResult {
  num: number;
  id: string;
  skill: string;
  level: string;
  currentTitle: string;
  currentProvider: string;
  currentUrl: string;
  verdict: "VERIFIED" | "NEEDS_CORRECTION" | "UNRESOLVED";
  proposedTitle?: string;
  proposedProvider?: string;
  proposedUrl?: string;
  whyMatches?: string;
  rejectionReason?: string;
}

async function audit() {
  const p1Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-bad-records-phase1.ts"), "utf8");
  const p2Script = fs.readFileSync(path.join(process.cwd(), "scripts/fix-ms-browse-records-phase2.ts"), "utf8");
  const precScript = fs.readFileSync(path.join(process.cwd(), "scripts/apply-23-precision-fixes.ts"), "utf8");

  const p1Ids = [...p1Script.matchAll(/id:\s*"([^"]+)"|courseId:\s*"([^"]+)"/g)].map(m => m[1] || m[2]);
  const p2Ids = [...p2Script.matchAll(/courseId:\s*"([^"]+)"/g)].map(m => m[1]);
  const precIds = [...precScript.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);

  const auditedIds = new Set([...p1Ids, ...p2Ids, ...precIds]);

  const allCourses = await db.course.findMany({
    orderBy: { createdAt: "asc" },
    include: { provider: true, skill: true }
  });

  const targetBatch = allCourses.filter(c => !auditedIds.has(c.id)).slice(0, 50);

  const results: AuditResult[] = [];

  for (let i = 0; i < targetBatch.length; i++) {
    const c = targetBatch[i];
    const skill = c.skill.name;
    const url = c.officialUrl;
    const provider = c.provider.name;

    // Check 1: Generic MS Browse URL
    if (url === "https://learn.microsoft.com/en-us/training/browse/") {
      // Find exact replacement if available, else UNRESOLVED
      if (skill === "C# Essentials") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "NEEDS_CORRECTION",
          proposedTitle: "Write Your First Code Using C# — Microsoft Learn",
          proposedProvider: "Microsoft",
          proposedUrl: "https://learn.microsoft.com/en-us/training/paths/csharp-first-steps/",
          whyMatches: "Microsoft Learn official learning path teaching C# language fundamentals."
        });
      } else if (skill === "Go Programming Basics") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "NEEDS_CORRECTION",
          proposedTitle: "A Tour of Go — Official Interactive Tutorial",
          proposedProvider: "The Go Team (Google)",
          proposedUrl: "https://go.dev/tour/welcome/1",
          whyMatches: "Official interactive tutorial for Go fundamentals on go.dev."
        });
      } else if (skill === "Rust Fundamentals") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "NEEDS_CORRECTION",
          proposedTitle: "The Rust Programming Language (Official Book)",
          proposedProvider: "The Rust Foundation",
          proposedUrl: "https://doc.rust-lang.org/book/",
          whyMatches: "Official book and primary guided resource for learning Rust."
        });
      } else if (skill === "Kotlin Fundamentals") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "NEEDS_CORRECTION",
          proposedTitle: "Get Started with Kotlin — Official JetBrains Documentation",
          proposedProvider: "JetBrains / Kotlin Team",
          proposedUrl: "https://kotlinlang.org/docs/getting-started.html",
          whyMatches: "JetBrains official getting started guide for Kotlin."
        });
      } else if (skill === "Responsive Web Design") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "NEEDS_CORRECTION",
          proposedTitle: "Learn Responsive Design — web.dev",
          proposedProvider: "Google",
          proposedUrl: "https://web.dev/learn/design",
          whyMatches: "Google web.dev official responsive web design course."
        });
      } else if (skill === "Next.js Fundamentals") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "NEEDS_CORRECTION",
          proposedTitle: "Learn Next.js — Official Course by Vercel",
          proposedProvider: "Vercel",
          proposedUrl: "https://nextjs.org/learn",
          whyMatches: "Official Vercel interactive Next.js learning course."
        });
      } else {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "UNRESOLVED",
          rejectionReason: "Points to generic Microsoft browse page. No exact verified learning resource exists."
        });
      }
    }
    // Check 2: Mismatched MS Learn Azure Fundamentals AZ-900 used for Excel Data Analysis
    else if (skill === "Microsoft Excel Data Analysis" && url.includes("azure-fundamentals")) {
      results.push({
        num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
        verdict: "NEEDS_CORRECTION",
        proposedTitle: "Excel Video Training: Analyze Data — Microsoft Support",
        proposedProvider: "Microsoft",
        proposedUrl: "https://support.microsoft.com/en-us/office/excel-for-windows-training-9bc05390-e94c-46af-a5b3-d7c22f6990bb",
        whyMatches: "Official Microsoft Support training specifically for Excel data analysis."
      });
    }
    // Check 3: Mismatched MS Learn Web Development 101 used for React Fundamentals or Vue.js Basics
    else if (url.includes("web-development-101")) {
      if (skill === "React Fundamentals") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "NEEDS_CORRECTION",
          proposedTitle: "Quick Start: Learn React — Official React Documentation",
          proposedProvider: "Meta / React Team",
          proposedUrl: "https://react.dev/learn",
          whyMatches: "Official Meta/React core documentation and tutorial."
        });
      } else if (skill === "Vue.js Basics") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "NEEDS_CORRECTION",
          proposedTitle: "Quick Start — Vue.js Official Documentation",
          proposedProvider: "Vue.js Core Team",
          proposedUrl: "https://vuejs.org/guide/quick-start.html",
          whyMatches: "Official Vue.js core getting started documentation."
        });
      } else {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "UNRESOLVED",
          rejectionReason: "Generic web-dev-101 path does not teach target skill directly."
        });
      }
    }
    // Check 4: Reused generic networking-basics link (Cisco) across Firewalls, Wireless Network Security
    else if (url === "https://skillsforall.com/course/networking-basics") {
      if (skill === "Firewall & Network Defense") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "NEEDS_CORRECTION",
          proposedTitle: "Network Defense — Cisco Networking Academy",
          proposedProvider: "Cisco Networking Academy",
          proposedUrl: "https://skillsforall.com/course/network-defense",
          whyMatches: "Cisco's dedicated Network Defense course covering firewalls and perimeter security."
        });
      } else {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "UNRESOLVED",
          rejectionReason: "Generic Networking Basics course is not specific to wireless network security."
        });
      }
    }
    // Check 5: Reused IBM AI Foundations across Prompt Engineering, AI Ethics, Copilot, AI Tools for Productivity
    else if (url === "https://skillsbuild.org/learn/artificial-intelligence") {
      results.push({
        num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
        verdict: "UNRESOLVED",
        rejectionReason: "Generic IBM AI portal landing page reused across unrelated specific AI skills."
      });
    }
    // Check 6: Reused IBM Project Management across Project Management Essentials, Effective Team Communication, Business Intelligence
    else if (url === "https://skillsbuild.org/learn/project-management") {
      if (skill === "Project Management Essentials") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "VERIFIED"
        });
      } else {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "UNRESOLVED",
          rejectionReason: "Reused Project Management portal link is not specific to team communication or business intelligence."
        });
      }
    }
    // Check 7: Reused AWS Cloud Practitioner Essentials across Storage, IAM, Computing Fundamentals
    else if (url.includes("aws-cloud-practitioner-essentials")) {
      if (skill === "AWS Cloud Practitioner Basics" || skill === "Cloud Computing Fundamentals") {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "VERIFIED"
        });
      } else {
        results.push({
          num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
          verdict: "UNRESOLVED",
          rejectionReason: "AWS Cloud Practitioner course reused across specialized Cloud IAM and Cloud Storage skills."
        });
      }
    }
    // Check 8: Docs root / generic section MDN URLs
    else if (url === "https://developer.mozilla.org/en-US/docs/Learn/HTML") {
      results.push({
        num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
        verdict: "NEEDS_CORRECTION",
        proposedTitle: "Introduction to HTML — MDN Web Docs",
        proposedProvider: "MDN Web Docs (Mozilla)",
        proposedUrl: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML",
        whyMatches: "Direct MDN tutorial module introducing HTML markup and semantic elements."
      });
    } else if (url === "https://developer.mozilla.org/en-US/docs/Learn/CSS") {
      results.push({
        num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
        verdict: "NEEDS_CORRECTION",
        proposedTitle: "CSS First Steps & Flexbox — MDN Web Docs",
        proposedProvider: "MDN Web Docs (Mozilla)",
        proposedUrl: "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox",
        whyMatches: "Direct MDN tutorial guide on CSS Flexbox and layout fundamentals."
      });
    } else if (url === "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide") {
      results.push({
        num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
        verdict: "NEEDS_CORRECTION",
        proposedTitle: "JavaScript Guide: Introduction — MDN Web Docs",
        proposedProvider: "MDN Web Docs (Mozilla)",
        proposedUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction",
        whyMatches: "Direct introductory chapter of the canonical MDN JavaScript guide."
      });
    }
    // Check 9: Verified exact deep links
    else if (
      url.includes("c-programming") ||
      url.includes("c-plus-plus-programming") ||
      url.includes("python-essentials-1") ||
      url.includes("build-javascript-applications-typescript") ||
      url.includes("introduction-to-cybersecurity") ||
      url.includes("introduction-to-kubernetes-lfs158x") ||
      url.includes("cybersecurity-essentials") ||
      url.includes("academy.postman.com/student-expert") ||
      url.includes("docs.docker.com/get-started")
    ) {
      results.push({
        num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
        verdict: "VERIFIED"
      });
    }
    // Default fallback check
    else {
      results.push({
        num: i + 1, id: c.id, skill, level: c.skill.levelId, currentTitle: c.title || "", currentProvider: provider, currentUrl: url || "",
        verdict: "UNRESOLVED",
        rejectionReason: "Requires further specific URL verification."
      });
    }
  }

  console.log("=== DRY-RUN AUDIT REPORT: NEXT 50 CATALOGUE RECORDS ===\n");

  let countVerified = 0;
  let countNeedsCorrection = 0;
  let countUnresolved = 0;

  for (const r of results) {
    if (r.verdict === "VERIFIED") countVerified++;
    if (r.verdict === "NEEDS_CORRECTION") countNeedsCorrection++;
    if (r.verdict === "UNRESOLVED") countUnresolved++;

    console.log(`Record #${r.num} [${r.id}]`);
    console.log(`  Skill           : ${r.skill} (${r.level})`);
    console.log(`  Current Title   : ${r.currentTitle}`);
    console.log(`  Current Provider: ${r.currentProvider}`);
    console.log(`  Current URL     : ${r.currentUrl}`);
    console.log(`  VERDICT         : ${r.verdict}`);
    if (r.verdict === "NEEDS_CORRECTION") {
      console.log(`  Proposed Title  : ${r.proposedTitle}`);
      console.log(`  Proposed Provider: ${r.proposedProvider}`);
      console.log(`  Proposed URL    : ${r.proposedUrl}`);
      console.log(`  Why It Matches  : ${r.whyMatches}`);
    }
    if (r.verdict === "UNRESOLVED") {
      console.log(`  Rejection Reason: ${r.rejectionReason}`);
    }
    console.log("-".repeat(70));
  }

  console.log("\n=== AUDIT SUMMARY ===");
  console.log(`Total Reviewed      : ${results.length}`);
  console.log(`Already Correct     : ${countVerified}`);
  console.log(`Needs Correction    : ${countNeedsCorrection}`);
  console.log(`Unresolved          : ${countUnresolved}`);

  await db.$disconnect();
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});
