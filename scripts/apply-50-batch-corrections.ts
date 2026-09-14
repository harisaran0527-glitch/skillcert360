import "dotenv/config";
import { PrismaClient, UrlStatus } from "@prisma/client";

const db = new PrismaClient();

interface Correction {
  id: string;
  skill: string;
  newTitle: string;
  newProvider: string;
  newProviderWebsite: string;
  newUrl: string;
}

const CORRECTIONS: Correction[] = [
  {
    id: "cmtz8ce3t000twutou1rfgkzn",
    skill: "Go Programming Basics",
    newTitle: "A Tour of Go — Official Interactive Tutorial",
    newProvider: "The Go Team (Google)",
    newProviderWebsite: "https://go.dev",
    newUrl: "https://go.dev/tour/welcome/1"
  },
  {
    id: "cmtz8cgk0000zwutoylyp8t7b",
    skill: "Rust Fundamentals",
    newTitle: "The Rust Programming Language (Official Book)",
    newProvider: "The Rust Foundation",
    newProviderWebsite: "https://www.rust-lang.org",
    newUrl: "https://doc.rust-lang.org/book/"
  },
  {
    id: "cmtz8cj5t0015wuto7jgpcmwg",
    skill: "C# Essentials",
    newTitle: "Write Your First Code Using C# — Microsoft Learn",
    newProvider: "Microsoft",
    newProviderWebsite: "https://learn.microsoft.com",
    newUrl: "https://learn.microsoft.com/en-us/training/paths/csharp-first-steps/"
  },
  {
    id: "cmtz8co29001hwutolduc598z",
    skill: "Modern JavaScript (ES6+)",
    newTitle: "JavaScript Guide: Introduction — MDN Web Docs",
    newProvider: "MDN Web Docs (Mozilla)",
    newProviderWebsite: "https://developer.mozilla.org",
    newUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction"
  },
  {
    id: "cmtz8cvt5001zwutomhsqcehq",
    skill: "Kotlin Fundamentals",
    newTitle: "Get Started with Kotlin — Official JetBrains Documentation",
    newProvider: "JetBrains / Kotlin Team",
    newProviderWebsite: "https://kotlinlang.org",
    newUrl: "https://kotlinlang.org/docs/getting-started.html"
  },
  {
    id: "cmtz8cy3g0025wutohvhv3bkm",
    skill: "HTML5 & Semantic Web",
    newTitle: "Introduction to HTML — MDN Web Docs",
    newProvider: "MDN Web Docs (Mozilla)",
    newProviderWebsite: "https://developer.mozilla.org",
    newUrl: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML"
  },
  {
    id: "cmtz8d0dz002bwutox2dh04k7",
    skill: "CSS3 & Flexbox Layouts",
    newTitle: "CSS First Steps & Flexbox — MDN Web Docs",
    newProvider: "MDN Web Docs (Mozilla)",
    newProviderWebsite: "https://developer.mozilla.org",
    newUrl: "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox"
  },
  {
    id: "cmtz8d2x3002hwutouru23hdk",
    skill: "Responsive Web Design",
    newTitle: "Learn Responsive Design — web.dev",
    newProvider: "Google",
    newProviderWebsite: "https://web.dev",
    newUrl: "https://web.dev/learn/design"
  },
  {
    id: "cmtz8d5ad002nwutobpc9kjce",
    skill: "React Fundamentals",
    newTitle: "Quick Start: Learn React — Official React Documentation",
    newProvider: "Meta / React Team",
    newProviderWebsite: "https://react.dev",
    newUrl: "https://react.dev/learn"
  },
  {
    id: "cmtz8d7kt002twutopk8v1e5e",
    skill: "Next.js Fundamentals",
    newTitle: "Learn Next.js — Official Course by Vercel",
    newProvider: "Vercel",
    newProviderWebsite: "https://nextjs.org",
    newUrl: "https://nextjs.org/learn"
  },
  {
    id: "cmtz8da05002zwutoiktauilz",
    skill: "Vue.js Basics",
    newTitle: "Quick Start — Vue.js Official Documentation",
    newProvider: "Vue.js Core Team",
    newProviderWebsite: "https://vuejs.org",
    newUrl: "https://vuejs.org/guide/quick-start.html"
  },
  {
    id: "cmtz8kt2b0082wubkod0ymp4k",
    skill: "Firewall & Network Defense",
    newTitle: "Network Defense — Cisco Networking Academy",
    newProvider: "Cisco Networking Academy",
    newProviderWebsite: "https://skillsforall.com",
    newUrl: "https://skillsforall.com/course/network-defense"
  },
  {
    id: "cmtz8kt2a0077wubko9jew8x7",
    skill: "Microsoft Excel Data Analysis",
    newTitle: "Excel Video Training: Analyze Data — Microsoft Support",
    newProvider: "Microsoft",
    newProviderWebsite: "https://support.microsoft.com",
    newUrl: "https://support.microsoft.com/en-us/office/excel-for-windows-training-9bc05390-e94c-46af-a5b3-d7c22f6990bb"
  },
  {
    id: "cmtz8kt2a006cwubk9wff3y9o",
    skill: "Vue.js Basics",
    newTitle: "Quick Start — Vue.js Official Documentation",
    newProvider: "Vue.js Core Team",
    newProviderWebsite: "https://vuejs.org",
    newUrl: "https://vuejs.org/guide/quick-start.html"
  }
];

async function main() {
  console.log(`=== APPLYING 14 VERIFIED CORRECTIONS TO DB ===\n`);

  await db.$connect();

  const allProviders = await db.provider.findMany();
  const providerMap = new Map<string, string>();
  for (const p of allProviders) providerMap.set(p.name.toLowerCase(), p.id);

  let applied = 0;

  for (const corr of CORRECTIONS) {
    let providerId = providerMap.get(corr.newProvider.toLowerCase());
    if (!providerId) {
      const partial = allProviders.find(
        p => p.name.toLowerCase().includes(corr.newProvider.toLowerCase()) || corr.newProvider.toLowerCase().includes(p.name.toLowerCase())
      );
      if (partial) {
        providerId = partial.id;
      } else {
        const newP = await db.provider.create({
          data: { name: corr.newProvider, website: corr.newProviderWebsite }
        });
        providerId = newP.id;
        providerMap.set(newP.name.toLowerCase(), newP.id);
        allProviders.push(newP);
      }
    }

    await db.course.update({
      where: { id: corr.id },
      data: {
        title: corr.newTitle,
        name: corr.newTitle,
        provider: { connect: { id: providerId } },
        officialUrl: corr.newUrl,
        officialUrlStatus: UrlStatus.VERIFIED,
        active: true,
        verifiedAt: new Date()
      }
    });

    console.log(`✓ Applied [${corr.id.slice(-8)}] ${corr.skill} → ${corr.newUrl}`);
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
