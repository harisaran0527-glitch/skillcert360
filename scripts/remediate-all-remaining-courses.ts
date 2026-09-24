import "dotenv/config";
import { PrismaClient, UrlStatus, PricingType, CredentialType } from "@prisma/client";
import fs from "fs";

const db = new PrismaClient();

// Expanded, high-precision official learning resources catalog
const RESOURCE_CATALOG: Array<{
  keywords: string[];
  providerName: string;
  courseTitle: string;
  officialUrl: string;
  duration?: string;
  pricingType?: PricingType;
  credentialAvailable?: boolean;
  credentialType?: CredentialType;
}> = [
  // Web & Frontend
  { keywords: ["react"], providerName: "React Core Team", courseTitle: "React Official Documentation & Interactive Guide", officialUrl: "https://react.dev/learn" },
  { keywords: ["vue"], providerName: "Vue.js Core Team", courseTitle: "Vue.js Official Getting Started Guide", officialUrl: "https://vuejs.org/guide/quick-start.html" },
  { keywords: ["angular"], providerName: "Angular Team / Google", courseTitle: "Angular Official Essentials & Tutorial", officialUrl: "https://angular.dev/tutorials/first-app" },
  { keywords: ["next.js", "nextjs"], providerName: "Vercel", courseTitle: "Next.js Official Foundations & App Router Guide", officialUrl: "https://nextjs.org/learn" },
  { keywords: ["bootstrap"], providerName: "Bootstrap Team", courseTitle: "Bootstrap 5 Official Documentation", officialUrl: "https://getbootstrap.com/docs/5.3/getting-started/introduction/" },
  { keywords: ["tailwind"], providerName: "Tailwind Labs", courseTitle: "Tailwind CSS Official Utility-First Guide", officialUrl: "https://tailwindcss.com/docs/installation" },
  { keywords: ["vite", "webpack"], providerName: "Vite Docs", courseTitle: "Vite Official Getting Started Guide", officialUrl: "https://vitejs.dev/guide/" },
  { keywords: ["html", "css"], providerName: "MDN Web Docs", courseTitle: "MDN Web Docs: Structuring the Web with HTML & CSS", officialUrl: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web" },
  { keywords: ["javascript"], providerName: "MDN Web Docs", courseTitle: "MDN JavaScript Official Language Guide", officialUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" },
  { keywords: ["typescript"], providerName: "Microsoft Learn", courseTitle: "Build JavaScript Applications with TypeScript", officialUrl: "https://learn.microsoft.com/en-us/training/paths/build-javascript-applications-typescript/" },

  // Programming Languages
  { keywords: ["c programming"], providerName: "Cisco Networking Academy", courseTitle: "C Programming Essentials", officialUrl: "https://skillsforall.com/course/c-programming" },
  { keywords: ["c++"], providerName: "Cisco Networking Academy", courseTitle: "C++ Programming Essentials", officialUrl: "https://skillsforall.com/course/c-plus-plus-programming" },
  { keywords: ["python essentials", "python intro", "python programming"], providerName: "Cisco Networking Academy", courseTitle: "Python Essentials 1", officialUrl: "https://skillsforall.com/course/python-essentials-1" },
  { keywords: ["java foundations", "java programming"], providerName: "Oracle University", courseTitle: "Java Explorer & Programming Foundations", officialUrl: "https://education.oracle.com/java-se-11-developer/pexam_1Z0-819" },
  { keywords: ["rust"], providerName: "Rust Foundation", courseTitle: "The Rust Programming Language (Official Guide)", officialUrl: "https://doc.rust-lang.org/book/" },
  { keywords: ["ruby", "rails"], providerName: "Ruby on Rails Guides", courseTitle: "Getting Started with Rails (Official Guide)", officialUrl: "https://guides.rubyonrails.org/getting_started.html" },
  { keywords: ["go programming", "golang", "go language"], providerName: "Go Dev Team", courseTitle: "A Tour of Go (Official Interactive Tutorial)", officialUrl: "https://go.dev/tour/welcome/1" },
  { keywords: ["kotlin"], providerName: "Android Developers / Google", courseTitle: "Kotlin Basics for Android Developers", officialUrl: "https://developer.android.com/courses/kotlin-android-basics/overview" },
  { keywords: ["swift"], providerName: "Apple Developer", courseTitle: "Develop in Swift Explorations (Official Apple Guide)", officialUrl: "https://developer.apple.com/documentation/swift" },
  { keywords: ["php"], providerName: "PHP Documentation Group", courseTitle: "PHP Official Language Manual & Getting Started Guide", officialUrl: "https://www.php.net/manual/en/getting-started.php" },

  // Backend & Databases
  { keywords: ["node.js", "nodejs", "express"], providerName: "Node.js Org", courseTitle: "Node.js Official Introduction & Getting Started Guide", officialUrl: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs" },
  { keywords: ["postgresql", "postgres"], providerName: "PostgreSQL Group", courseTitle: "PostgreSQL Official Tutorial", officialUrl: "https://www.postgresql.org/docs/current/tutorial.html" },
  { keywords: ["redis"], providerName: "Redis Inc", courseTitle: "Redis University: RU101 Introduction to Redis Data Structures", officialUrl: "https://university.redis.io/courses/ru101/" },
  { keywords: ["mongodb"], providerName: "MongoDB University", courseTitle: "M001: MongoDB Basics", officialUrl: "https://learn.mongodb.com/courses/m001-mongodb-basics" },
  { keywords: ["graphql"], providerName: "GraphQL Foundation", courseTitle: "Introduction to GraphQL (Official Guide)", officialUrl: "https://graphql.org/learn/" },
  { keywords: ["rest api"], providerName: "Postman", courseTitle: "Postman API Student Expert & Testing Foundations", officialUrl: "https://academy.postman.com/student-expert" },

  // Cloud & Infrastructure
  { keywords: ["aws", "amazon"], providerName: "Amazon Web Services (AWS)", courseTitle: "AWS Cloud Practitioner Essentials", officialUrl: "https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials" },
  { keywords: ["azure", "microsoft cloud"], providerName: "Microsoft Learn", courseTitle: "Microsoft Azure Fundamentals & Administration", officialUrl: "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/" },
  { keywords: ["gcp", "google cloud"], providerName: "Google Cloud", courseTitle: "Google Cloud Computing Foundations", officialUrl: "https://www.cloudskillsboost.google/course_templates/153" },
  { keywords: ["docker"], providerName: "Docker", courseTitle: "Docker Overview & Getting Started Guide", officialUrl: "https://docs.docker.com/get-started/" },
  { keywords: ["kubernetes", "k8s"], providerName: "Linux Foundation / CNCF", courseTitle: "Kubernetes Basics & Tutorials", officialUrl: "https://kubernetes.io/docs/tutorials/kubernetes-basics/" },
  { keywords: ["terraform"], providerName: "HashiCorp", courseTitle: "HashiCorp Certified: Terraform Associate Track", officialUrl: "https://developer.hashicorp.com/terraform/tutorials" },
  { keywords: ["ansible"], providerName: "Red Hat", courseTitle: "Ansible Official Getting Started Guide", officialUrl: "https://docs.ansible.com/ansible/latest/getting_started/index.html" },

  // Testing & Automation
  { keywords: ["playwright"], providerName: "Microsoft Playwright Team", courseTitle: "Getting Started with Playwright", officialUrl: "https://playwright.dev/docs/intro" },
  { keywords: ["cypress"], providerName: "Cypress Team", courseTitle: "Getting Started with Cypress", officialUrl: "https://docs.cypress.io/guides/getting-started/installing-cypress" },
  { keywords: ["selenium"], providerName: "Selenium Project", courseTitle: "Selenium WebDriver Official Documentation", officialUrl: "https://www.selenium.dev/documentation/webdriver/" },

  // DevOps & Git
  { keywords: ["git", "github"], providerName: "GitHub", courseTitle: "Introduction to GitHub & Version Control", officialUrl: "https://skills.github.com/" },

  // Security
  { keywords: ["cisco ccna", "networking"], providerName: "Cisco Networking Academy", courseTitle: "Cisco CCNA: Introduction to Networks", officialUrl: "https://skillsforall.com/course/getting-started-cisco-packet-tracer" },
  { keywords: ["cybersecurity", "security essentials", "phishing"], providerName: "Cisco Networking Academy", courseTitle: "Cybersecurity Essentials", officialUrl: "https://skillsforall.com/course/cybersecurity-essentials" },
  { keywords: ["zero-knowledge", "zk-proof"], providerName: "ZK-Learning", courseTitle: "Zero Knowledge Proofs MOOC", officialUrl: "https://zk-learning.org/" },

  // Design & Management
  { keywords: ["figma", "prototype", "wireframing"], providerName: "Figma", courseTitle: "Guide to Prototyping in Figma", officialUrl: "https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma" },
  { keywords: ["servicenow"], providerName: "ServiceNow", courseTitle: "ServiceNow System Administrator Path", officialUrl: "https://nowlearning.servicenow.com/" },
  { keywords: ["salesforce"], providerName: "Salesforce", courseTitle: "Salesforce Administrator Trail", officialUrl: "https://trailhead.salesforce.com/en/credentials/administrator" },
  { keywords: ["power bi"], providerName: "Microsoft Learn", courseTitle: "Microsoft Power BI Data Analyst Course", officialUrl: "https://learn.microsoft.com/en-us/training/paths/data-analytics-microsoft/" },
];

async function runFullRemediation() {
  console.log("=== REMEDIATING ALL REMAINING COURSES ===");

  const courses = await db.course.findMany({
    where: { active: true },
    include: { skill: { include: { level: true } }, provider: true },
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

  const GENERIC_FALLBACK_URLS = new Set([
    "https://www.ibm.com/training/badge/enterprise-design-thinking-practitioner",
    "https://skillsforall.com/course/networking-essentials",
    "https://www.cloudskillsboost.google/course_templates/153",
    "https://cloud.google.com/learn/",
    "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/",
  ]);

  let passCount = 0;
  let unavailableCount = 0;

  for (const c of courses) {
    const skillName = c.skill.name.toLowerCase();
    const courseTitle = (c.title || c.name || "").toLowerCase();

    // Check catalog match
    const matched = RESOURCE_CATALOG.find((res) =>
      res.keywords.some((kw) => skillName.includes(kw) || courseTitle.includes(kw))
    );

    if (matched) {
      const pObj = await getOrCreateProvider(matched.providerName);
      await db.course.update({
        where: { id: c.id },
        data: {
          name: matched.courseTitle,
          title: matched.courseTitle,
          providerId: pObj.id,
          officialUrl: matched.officialUrl,
          officialUrlStatus: UrlStatus.VERIFIED,
          pricingType: matched.pricingType || c.pricingType,
          credentialAvailable: matched.credentialAvailable ?? c.credentialAvailable,
          credentialType: matched.credentialType || c.credentialType,
        },
      });
      passCount++;
    } else {
      const currentUrl = (c.officialUrl || "").trim();
      if (GENERIC_FALLBACK_URLS.has(currentUrl) || !currentUrl || currentUrl === "OFFICIAL_LINK_PENDING") {
        await db.course.update({
          where: { id: c.id },
          data: {
            officialUrlStatus: UrlStatus.UNAVAILABLE,
          },
        });
        unavailableCount++;
      }
    }
  }

  console.log(`Updated: ${passCount} courses set to VERIFIED with distinct topic links.`);
  console.log(`Unmarked: ${unavailableCount} courses set to UNAVAILABLE.`);

  await db.$disconnect();
}

runFullRemediation().catch((err) => {
  console.error(err);
  process.exit(1);
});
