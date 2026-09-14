import "dotenv/config";
import { PrismaClient, UrlStatus } from "@prisma/client";

const db = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN !== "false";

interface PrecisionFix {
  id: string;
  skill: string;
  title: string;
  provider: string;
  providerWebsite: string;
  url: string;
  verdict: "VERIFIED" | "UNRESOLVED";
  reason: string;
}

const PRECISION_FIXES: PrecisionFix[] = [
  {
    id: "cmtz8kt2a005zwubk0q9fscib",
    skill: "Go Programming Basics",
    title: "A Tour of Go — Official Interactive Tutorial",
    provider: "The Go Team (Google)",
    providerWebsite: "https://go.dev",
    url: "https://go.dev/tour/welcome/1",
    verdict: "VERIFIED",
    reason: "Official interactive tutorial for Go fundamentals."
  },
  {
    id: "cmtznfj7e0079wu8cwe5v2zci",
    skill: "Go Programming Introduction",
    title: "Tutorial: Get Started with Go — Official Go Documentation",
    provider: "The Go Team (Google)",
    providerWebsite: "https://go.dev",
    url: "https://go.dev/doc/tutorial/getting-started",
    verdict: "VERIFIED",
    reason: "Official getting-started tutorial for writing first Go package."
  },
  {
    id: "cmtz8kt2b007swubkf6ig8w28",
    skill: "CI/CD Pipeline Fundamentals",
    title: "Build Applications with Azure DevOps — Microsoft Learn",
    provider: "Microsoft",
    providerWebsite: "https://learn.microsoft.com",
    url: "https://learn.microsoft.com/en-us/training/paths/build-applications-with-azure-devops/",
    verdict: "VERIFIED",
    reason: "Azure DevOps CI/CD pipeline learning path."
  },
  {
    id: "cmtznfrjw00dbwu8cugbsnzbe",
    skill: "CI/CD Pipeline Concepts",
    title: "Quickstart for GitHub Actions — GitHub Documentation",
    provider: "GitHub",
    providerWebsite: "https://docs.github.com",
    url: "https://docs.github.com/en/actions/writing-workflows/quickstart",
    verdict: "VERIFIED",
    reason: "GitHub Actions automated workflows quickstart."
  },
  {
    id: "cmtz8kt2c0092wubkcrnodzsy",
    skill: "RegEx (Regular Expressions) Basics",
    title: "Interactive Regular Expressions Tutorial — RegexOne",
    provider: "RegexOne",
    providerWebsite: "https://regexone.com",
    url: "https://regexone.com/",
    verdict: "VERIFIED",
    reason: "Dedicated interactive tutorial for Regex fundamentals."
  },
  {
    id: "cmtznfldb0095wu8c9l6ji2py",
    skill: "Regular Expressions (Regex)",
    title: "Regular Expressions Guide — MDN Web Docs",
    provider: "MDN Web Docs (Mozilla)",
    providerWebsite: "https://developer.mozilla.org",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions",
    verdict: "VERIFIED",
    reason: "Mozilla official deep reference guide for Regex."
  },
  {
    id: "cmtz8kt2c0094wubkcpt0mmgw",
    skill: "Package Managers (NPM / Yarn / PNPM)",
    title: "Package Managers (NPM / Yarn / PNPM)",
    provider: "Microsoft",
    providerWebsite: "https://learn.microsoft.com",
    url: "https://learn.microsoft.com/en-us/training/browse/",
    verdict: "UNRESOLVED",
    reason: "No single official course covers NPM, Yarn, and PNPM together under one vendor."
  },
  {
    id: "cmtznfivs0071wu8cwvz6f902",
    skill: "NPM & Package Management",
    title: "Getting Started with npm — npm Official Documentation",
    provider: "npm",
    providerWebsite: "https://docs.npmjs.com",
    url: "https://docs.npmjs.com/getting-started",
    verdict: "VERIFIED",
    reason: "Official npm getting started documentation."
  },
  {
    id: "cmtznfgd0005fwu8c3yqerkva",
    skill: "Problem Solving with Logic",
    title: "CS50x: Introduction to Computer Science — Harvard / edX",
    provider: "Harvard University / edX",
    providerWebsite: "https://cs50.harvard.edu",
    url: "https://cs50.harvard.edu/x/",
    verdict: "VERIFIED",
    reason: "Harvard CS50 course on problem solving and computational logic."
  },
  {
    id: "cmtz8kt2b008qwubkw2aw85qn",
    skill: "Problem-Solving for Engineers",
    title: "Problem-Solving for Engineers",
    provider: "Microsoft",
    providerWebsite: "https://learn.microsoft.com",
    url: "https://learn.microsoft.com/en-us/training/browse/",
    verdict: "UNRESOLVED",
    reason: "General CS courses fail strict engineering problem solving match."
  },
  {
    id: "cmtz8kt2b007iwubk5rpny488",
    skill: "Microservices Architecture Basics",
    title: "Microservices Architecture Basics",
    provider: "Microsoft",
    providerWebsite: "https://learn.microsoft.com",
    url: "https://learn.microsoft.com/en-us/training/browse/",
    verdict: "UNRESOLVED",
    reason: "pattern reference sites fail structured learning module requirement."
  },
  {
    id: "cmtznfpvd00cjwu8cl3uho3t4",
    skill: "Microservices Introduction",
    title: "Introduction to .NET Microservices — Microsoft Learn",
    provider: "Microsoft",
    providerWebsite: "https://learn.microsoft.com",
    url: "https://learn.microsoft.com/en-us/training/modules/dotnet-microservices/",
    verdict: "VERIFIED",
    reason: "Microsoft Learn training module for microservices."
  },
  {
    id: "cmtz8kt2a006dwubkyjzrug2o",
    skill: "Tailwind CSS Basics",
    title: "Tailwind CSS — Utility-First Fundamentals (Official Docs)",
    provider: "Tailwind Labs",
    providerWebsite: "https://tailwindcss.com",
    url: "https://tailwindcss.com/docs/utility-first",
    verdict: "VERIFIED",
    reason: "Official Tailwind CSS utility-first syntax guide."
  },
  {
    id: "cmtznfh7u0067wu8cw1wksi50",
    skill: "Tailwind CSS Introduction",
    title: "Tailwind CSS Installation & Setup Guide — Official Docs",
    provider: "Tailwind Labs",
    providerWebsite: "https://tailwindcss.com",
    url: "https://tailwindcss.com/docs/installation",
    verdict: "VERIFIED",
    reason: "Official Tailwind CSS installation tutorial."
  },
  {
    id: "cmtznfn3300ahwu8c931gfpcp",
    skill: "VPN Technology Basics",
    title: "What is a VPN? (Virtual Private Networks) — Cloudflare Learning Center",
    provider: "Cloudflare",
    providerWebsite: "https://www.cloudflare.com",
    url: "https://www.cloudflare.com/learning/network-layer/what-is-a-vpn/",
    verdict: "VERIFIED",
    reason: "Cloudflare Learning Center structured module for VPN technology."
  },
  {
    id: "cmtznfnb100arwu8c3i3y2ctb",
    skill: "Firewalls & NAT Fundamentals",
    title: "Network Defense — Cisco Networking Academy / Skills for All",
    provider: "Cisco Networking Academy",
    providerWebsite: "https://skillsforall.com",
    url: "https://skillsforall.com/course/network-defense",
    verdict: "VERIFIED",
    reason: "Cisco official Network Defense course."
  },
  {
    id: "cmtznfpv900chwu8cqx7hr81q",
    skill: "Figma Basics",
    title: "Explore Design Files & Canvas Basics — Figma Help Center",
    provider: "Figma",
    providerWebsite: "https://help.figma.com",
    url: "https://help.figma.com/hc/en-us/articles/360040449773",
    verdict: "VERIFIED",
    reason: "Official Figma article guide for canvas and layer basics."
  },
  {
    id: "cmtz8kt2b0088wubkak3ymt0k",
    skill: "Figma Interface Design Basics",
    title: "Figma Interface Design Basics",
    provider: "Microsoft",
    providerWebsite: "https://learn.microsoft.com",
    url: "https://learn.microsoft.com/en-us/training/browse/",
    verdict: "UNRESOLVED",
    reason: "Help center section link rejected; no distinct single tutorial."
  },
  {
    id: "cmtz8kt2b008awubkocvcrv7j",
    skill: "Wireframing & Prototyping",
    title: "Create a Prototype in Figma — Official Figma Guide",
    provider: "Figma",
    providerWebsite: "https://help.figma.com",
    url: "https://help.figma.com/hc/en-us/articles/360040451373-Create-a-prototype",
    verdict: "VERIFIED",
    reason: "Official Figma tutorial article on creating interactive prototypes."
  },
  {
    id: "cmtz8kt2b008lwubkh1n8hzqb",
    skill: "Automated Email & Reporting",
    title: "Automate Processes with Microsoft Power Automate — Microsoft Learn",
    provider: "Microsoft",
    providerWebsite: "https://learn.microsoft.com",
    url: "https://learn.microsoft.com/en-us/training/paths/automate-process-power-automate/",
    verdict: "VERIFIED",
    reason: "Microsoft Learn path for automated tasks and reporting."
  },
  {
    id: "cmtz8kt2b008kwubk4w3854m1",
    skill: "API Integration & Webhooks",
    title: "Use Custom Connectors in Power Automate — Microsoft Learn",
    provider: "Microsoft",
    providerWebsite: "https://learn.microsoft.com",
    url: "https://learn.microsoft.com/en-us/training/modules/use-custom-connectors-power-automate/",
    verdict: "VERIFIED",
    reason: "Microsoft Learn module for custom REST API connectors & webhooks."
  },
  {
    id: "cmtznfjck007nwu8cz8skpkpn",
    skill: "Swift Basics",
    title: "A Swift Tour — The Swift Programming Language",
    provider: "Apple",
    providerWebsite: "https://developer.apple.com",
    url: "https://docs.swift.org/swift-book/documentation/the-swift-programming-language/guidedtour/",
    verdict: "VERIFIED",
    reason: "Apple Inc. official interactive tour for Swift language fundamentals."
  },
  {
    id: "cmtz8kt2a0071wubkpnbaax9g",
    skill: "Jupyter Notebooks Guide",
    title: "The Jupyter Notebook Interface — Official Guide",
    provider: "Project Jupyter",
    providerWebsite: "https://docs.jupyter.org",
    url: "https://jupyter-notebook.readthedocs.io/en/stable/notebook.html",
    verdict: "VERIFIED",
    reason: "Official user guide module for Jupyter Notebook interface."
  }
];

async function main() {
  const mode = DRY_RUN ? "DRY-RUN (NO DB CHANGES)" : "LIVE — APPLYING DB CHANGES";
  console.log(`\n=== RE-AUDIT PRECISION APPLY — ${mode} ===\n`);

  const verifiedFixes = PRECISION_FIXES.filter(f => f.verdict === "VERIFIED");
  const unresolvedFixes = PRECISION_FIXES.filter(f => f.verdict === "UNRESOLVED");

  console.log(`Total 23 precision records reviewed: ${PRECISION_FIXES.length}`);
  console.log(`Genuinely VERIFIED to apply        : ${verifiedFixes.length}`);
  console.log(`Remaining UNRESOLVED (skipped)     : ${unresolvedFixes.length}\n`);

  if (DRY_RUN) {
    console.log("Verified Mappings to be applied:\n");
    for (const f of verifiedFixes) {
      console.log(`✓ [${f.id}] Skill: ${f.skill}`);
      console.log(`  Title   : ${f.title}`);
      console.log(`  Provider: ${f.provider}`);
      console.log(`  URL     : ${f.url}`);
    }
    console.log("\nUnresolved Mappings to remain OFFICIAL_LINK_PENDING / MS Browse:\n");
    for (const f of unresolvedFixes) {
      console.log(`✗ [${f.id}] Skill: ${f.skill} — Reason: ${f.reason}`);
    }
    console.log("\nRe-run with DRY_RUN=false to apply verified mappings to DB.");
    return;
  }

  await db.$connect();
  console.log("Connected to DB.\n");

  const allProviders = await db.provider.findMany();
  const providerMap = new Map<string, string>();
  for (const p of allProviders) providerMap.set(p.name.toLowerCase(), p.id);

  let applied = 0;

  for (const fix of verifiedFixes) {
    let providerId = providerMap.get(fix.provider.toLowerCase());
    if (!providerId) {
      const partial = allProviders.find(
        p => p.name.toLowerCase().includes(fix.provider.toLowerCase()) || fix.provider.toLowerCase().includes(p.name.toLowerCase())
      );
      if (partial) {
        providerId = partial.id;
      } else {
        const newP = await db.provider.create({
          data: { name: fix.provider, website: fix.providerWebsite }
        });
        providerId = newP.id;
        providerMap.set(newP.name.toLowerCase(), newP.id);
        allProviders.push(newP);
      }
    }

    await db.course.update({
      where: { id: fix.id },
      data: {
        title: fix.title,
        name: fix.title,
        provider: { connect: { id: providerId } },
        officialUrl: fix.url,
        officialUrlStatus: UrlStatus.VERIFIED,
        active: true,
        verifiedAt: new Date()
      }
    });

    console.log(`✓ Applied [${fix.id.slice(-8)}] ${fix.skill} → ${fix.url}`);
    applied++;
  }

  console.log(`\n=== APPLY COMPLETE ===`);
  console.log(`Applied ${applied} verified updates to database.`);

  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
