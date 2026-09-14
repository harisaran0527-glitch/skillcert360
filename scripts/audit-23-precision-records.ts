import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TARGET_IDS = [
  "cmtz8kt2a005zwubk0q9fscib", // Go Programming Basics
  "cmtznfj7e0079wu8cwe5v2zci", // Go Programming Introduction
  "cmtz8kt2b007swubkf6ig8w28", // CI/CD Pipeline Fundamentals
  "cmtznfrjw00dbwu8cugbsnzbe", // CI/CD Pipeline Concepts
  "cmtz8kt2c0092wubkcrnodzsy", // RegEx (Regular Expressions) Basics
  "cmtznfldb0095wu8c9l6ji2py", // Regular Expressions (Regex)
  "cmtz8kt2c0094wubkcpt0mmgw", // Package Managers (NPM / Yarn / PNPM)
  "cmtznfivs0071wu8cwvz6f902", // NPM & Package Management
  "cmtznfgd0005fwu8c3yqerkva", // Problem Solving with Logic
  "cmtz8kt2b008qwubkw2aw85qn", // Problem-Solving for Engineers
  "cmtz8kt2b007iwubk5rpny488", // Microservices Architecture Basics
  "cmtznfpvd00cjwu8cl3uho3t4", // Microservices Introduction
  "cmtz8kt2a006dwubkyjzrug2o", // Tailwind CSS Basics
  "cmtznfh7u0067wu8cw1wksi50", // Tailwind CSS Introduction
  "cmtznfn3300ahwu8c931gfpcp", // VPN Technology Basics
  "cmtznfnb100arwu8c3i3y2ctb", // Firewalls & NAT Fundamentals
  "cmtz8kt2b0088wubkak3ymt0k", // Figma Interface Design Basics
  "cmtznfpv900chwu8cqx7hr81q", // Figma Basics
  "cmtz8kt2b008awubkocvcrv7j", // Wireframing & Prototyping
  "cmtz8kt2b008lwubkh1n8hzqb", // Automated Email & Reporting
  "cmtz8kt2b008kwubk4w3854m1", // API Integration & Webhooks
  "cmtznfjck007nwu8cz8skpkpn", // Swift Basics
  "cmtz8kt2a0071wubkpnbaax9g"  // Jupyter Notebooks Guide
];

async function main() {
  const courses = await db.course.findMany({
    where: { id: { in: TARGET_IDS } },
    include: { provider: true, skill: true }
  });

  console.log(`Found ${courses.length} courses out of ${TARGET_IDS.length} target IDs.\n`);

  for (const c of courses) {
    console.log(`ID: ${c.id}`);
    console.log(`Skill: ${c.skill.name}`);
    console.log(`Level: ${c.skill.levelId}`);
    console.log(`Title: ${c.title}`);
    console.log(`Provider: ${c.provider.name}`);
    console.log(`URL: ${c.officialUrl}`);
    console.log("-".repeat(60));
  }

  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
