/**
 * DRY-RUN COURSE AUDIT
 * =====================
 * Reads every VERIFIED + active course from the DB.
 * Does NOT make any DB changes.
 *
 * Checks each record for:
 *  1. URL plausibility vs. provider domain
 *  2. URL plausibility vs. skill name/category
 *  3. Homepage / search / dashboard links (not course-specific pages)
 *  4. Duplicate URLs (multiple courses pointing to the same page)
 *  5. Placeholder / known-bad URL patterns
 *  6. Provider name vs. URL domain mismatch
 *
 * Outputs:
 *  - Summary counts
 *  - First 20 records for manual inspection
 *  - Full mismatch / duplicate / unresolved lists
 *  - JSON report saved to scripts/audit-report.json
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const db = new PrismaClient();

// ---------------------------------------------------------------------------
// Known provider → expected domain fragments
// ---------------------------------------------------------------------------
const PROVIDER_DOMAIN_MAP: Record<string, string[]> = {
  "amazon web services": ["skillbuilder.aws", "aws.amazon.com", "amazonaws.com"],
  "aws": ["skillbuilder.aws", "aws.amazon.com"],
  "microsoft": ["learn.microsoft.com", "microsoft.com"],
  "google": ["cloud.google.com", "developers.google.com", "grow.google", "learndigital.withgoogle.com"],
  "google cloud": ["cloud.google.com"],
  "meta": ["facebook.com/business", "coursera.org", "edx.org"],
  "coursera": ["coursera.org"],
  "edx": ["edx.org"],
  "udemy": ["udemy.com"],
  "linkedin learning": ["linkedin.com/learning"],
  "pluralsight": ["pluralsight.com"],
  "datacamp": ["datacamp.com"],
  "kaggle": ["kaggle.com"],
  "ibm": ["ibm.com", "skillsbuild.org", "coursera.org"],
  "oracle": ["oracle.com", "education.oracle.com"],
  "cisco": ["cisco.com", "netacad.com", "learningnetwork.cisco.com"],
  "red hat": ["redhat.com", "learn.redhat.com"],
  "hashicorp": ["developer.hashicorp.com", "hashicorp.com"],
  "docker": ["docker.com", "training.docker.com"],
  "kubernetes": ["kubernetes.io", "training.linuxfoundation.org"],
  "linux foundation": ["training.linuxfoundation.org", "linuxfoundation.org"],
  "mongodb": ["mongodb.com/learn", "university.mongodb.com", "learn.mongodb.com"],
  "elastic": ["elastic.co", "training.elastic.co"],
  "tableau": ["tableau.com/learn", "training.tableau.com"],
  "salesforce": ["trailhead.salesforce.com", "salesforce.com"],
  "snowflake": ["training.snowflake.com", "snowflake.com"],
  "databricks": ["training.databricks.com", "databricks.com"],
  "pytorch": ["pytorch.org"],
  "tensorflow": ["tensorflow.org"],
  "fast.ai": ["fast.ai", "course.fast.ai"],
  "openai": ["platform.openai.com", "openai.com"],
  "hugging face": ["huggingface.co"],
  "scrum.org": ["scrum.org"],
  "pmi": ["pmi.org"],
  "comptia": ["comptia.org", "learn.comptia.org"],
  "ec-council": ["eccouncil.org", "aspen.eccouncil.org"],
  "isc2": ["isc2.org", "training.isc2.org"],
  "stanford online": ["online.stanford.edu"],
  "mit opencourseware": ["ocw.mit.edu"],
  "freecodecamp": ["freecodecamp.org"],
  "the odin project": ["theodinproject.com"],
  "w3schools": ["w3schools.com"],
  "mdn": ["developer.mozilla.org"],
  "react": ["react.dev", "reactjs.org"],
  "vue": ["vuejs.org", "vueschool.io"],
  "angular": ["angular.io", "angular.dev"],
  "node.js": ["nodejs.org"],
  "python": ["python.org", "docs.python.org"],
  "community courseware": [],
  "learning provider": [],
};

// ---------------------------------------------------------------------------
// URL patterns that indicate a homepage / search / dashboard (not a course page)
// ---------------------------------------------------------------------------
const HOMEPAGE_PATTERNS: RegExp[] = [
  /^https?:\/\/[^/]+\/?$/,
  /^https?:\/\/[^/]+\/?(index\.html?)?$/,
  /coursera\.org\/?$/,
  /coursera\.org\/browse\/?/,
  /coursera\.org\/search\?/,
  /edx\.org\/?$/,
  /edx\.org\/search\?/,
  /udemy\.com\/?$/,
  /udemy\.com\/courses\/?$/,
  /linkedin\.com\/learning\/?$/,
  /skillbuilder\.aws\/?$/,
  /learn\.microsoft\.com\/?$/,
  /learn\.microsoft\.com\/en-us\/?$/,
  /learn\.microsoft\.com\/en-us\/training\/?$/,
  /cloud\.google\.com\/learn\/?$/,
  /developers\.google\.com\/?$/,
  /pluralsight\.com\/browse\/?/,
  /pluralsight\.com\/search\?/,
  /datacamp\.com\/tracks\/?$/,
  /datacamp\.com\/?$/,
  /ibm\.com\/training\/?$/,
];

// ---------------------------------------------------------------------------
// Known placeholder / synthetic / bad URL fragments
// ---------------------------------------------------------------------------
const BAD_URL_FRAGMENTS: string[] = [
  "OFFICIAL_LINK_PENDING",
  "example.com",
  "placeholder",
  "todo",
  "tbd",
  "coming-soon",
  "learning-provider.com",
  "communitycoursware.com",
  "courseware.com/course",
];

function isHomepageLink(url: string): boolean {
  return HOMEPAGE_PATTERNS.some(p => p.test(url));
}

function isBadUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return BAD_URL_FRAGMENTS.some(f => lower.includes(f.toLowerCase()));
}

function checkProviderDomainMatch(
  providerName: string,
  url: string
): "ok" | "mismatch" | "unknown-provider" {
  const nameLower = providerName.toLowerCase();
  let expectedDomains: string[] | undefined;
  for (const [key, domains] of Object.entries(PROVIDER_DOMAIN_MAP)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      expectedDomains = domains;
      break;
    }
  }
  if (expectedDomains === undefined) return "unknown-provider";
  if (expectedDomains.length === 0) return "mismatch";
  return expectedDomains.some(d => url.includes(d)) ? "ok" : "mismatch";
}

function checkSkillUrlRelevance(
  skillName: string,
  url: string
): "likely-match" | "suspicious" {
  const urlLower = url.toLowerCase();
  const keyWords = skillName
    .toLowerCase()
    .split(/[\s\-_\/]+/)
    .filter(w => w.length > 3);
  const matchCount = keyWords.filter(w => urlLower.includes(w)).length;
  return matchCount >= 1 ? "likely-match" : "suspicious";
}

interface AuditResult {
  courseId: string;
  skillName: string;
  skillCategory: string;
  skillLevel: string;
  providerName: string;
  courseTitle: string;
  officialUrl: string;
  officialUrlStatus: string;
  active: boolean;
  verifiedAt: Date | null;
  issues: string[];
  verdict: "CLEAN" | "SUSPICIOUS" | "BAD";
}

function auditCourse(course: any): AuditResult {
  const issues: string[] = [];
  const url = course.officialUrl ?? "";
  const providerName = course.provider?.name ?? "";
  const skillName = course.skill?.name ?? "";

  if (!url || url.trim() === "") {
    issues.push("MISSING_URL");
  } else {
    if (isBadUrl(url)) issues.push("PLACEHOLDER_URL");
    if (isHomepageLink(url)) issues.push("HOMEPAGE_NOT_COURSE_PAGE");

    const domainCheck = checkProviderDomainMatch(providerName, url);
    if (domainCheck === "mismatch") {
      issues.push(`PROVIDER_DOMAIN_MISMATCH (provider="${providerName}")`);
    } else if (domainCheck === "unknown-provider") {
      issues.push(`UNKNOWN_PROVIDER_DOMAIN (provider="${providerName}")`);
    }

    if (skillName && checkSkillUrlRelevance(skillName, url) === "suspicious") {
      issues.push(`SKILL_URL_MISMATCH (skill="${skillName}")`);
    }
  }

  const syntheticProviders = ["community courseware", "learning provider", "synthetic", "placeholder"];
  if (syntheticProviders.some(s => providerName.toLowerCase().includes(s))) {
    issues.push(`SYNTHETIC_PROVIDER ("${providerName}")`);
  }

  const verdict: AuditResult["verdict"] =
    issues.length === 0
      ? "CLEAN"
      : issues.some(i =>
          i.includes("PLACEHOLDER") ||
          i.includes("MISSING") ||
          i.includes("SYNTHETIC") ||
          i.includes("HOMEPAGE")
        )
      ? "BAD"
      : "SUSPICIOUS";

  return {
    courseId: course.id,
    skillName,
    skillCategory: course.skill?.category?.name ?? "",
    skillLevel: course.skill?.level?.name ?? "",
    providerName,
    courseTitle: course.title ?? course.name ?? "",
    officialUrl: url,
    officialUrlStatus: course.officialUrlStatus,
    active: course.active,
    verifiedAt: course.verifiedAt,
    issues,
    verdict,
  };
}

async function main() {
  console.log("=== DRY-RUN COURSE AUDIT ===");
  console.log("NO DATABASE CHANGES WILL BE MADE.\n");

  await db.$connect();
  console.log("Connected to database.\n");

  console.log("Fetching all courses...");
  const allCourses = await db.course.findMany({
    include: {
      skill: { include: { category: true, level: true } },
      provider: true,
    },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Total courses in DB: ${allCourses.length}\n`);

  const verifiedActive = allCourses.filter(
    c => c.officialUrlStatus === "VERIFIED" && c.active
  );
  const verifiedInactive = allCourses.filter(
    c => c.officialUrlStatus === "VERIFIED" && !c.active
  );
  const pendingActive = allCourses.filter(
    c => c.officialUrlStatus === "OFFICIAL_LINK_PENDING" && c.active
  );
  const pendingInactive = allCourses.filter(
    c => c.officialUrlStatus === "OFFICIAL_LINK_PENDING" && !c.active
  );
  const retired = allCourses.filter(c => c.officialUrlStatus === "RETIRED");
  const unavailable = allCourses.filter(c => c.officialUrlStatus === "UNAVAILABLE");

  console.log("=== BREAKDOWN BY STATUS ===");
  console.log(`VERIFIED + active:     ${verifiedActive.length}`);
  console.log(`VERIFIED + inactive:   ${verifiedInactive.length}`);
  console.log(`PENDING + active:      ${pendingActive.length}`);
  console.log(`PENDING + inactive:    ${pendingInactive.length}`);
  console.log(`RETIRED:               ${retired.length}`);
  console.log(`UNAVAILABLE:           ${unavailable.length}`);
  console.log(`TOTAL:                 ${allCourses.length}\n`);

  console.log(`Auditing ${verifiedActive.length} VERIFIED+active courses...\n`);
  const auditResults: AuditResult[] = verifiedActive.map(c => auditCourse(c));

  // Detect duplicate URLs
  const urlCounts = new Map<string, number>();
  for (const r of auditResults) {
    urlCounts.set(r.officialUrl, (urlCounts.get(r.officialUrl) ?? 0) + 1);
  }
  const duplicateUrls = new Set(
    [...urlCounts.entries()].filter(([, count]) => count > 1).map(([url]) => url)
  );
  for (const r of auditResults) {
    if (duplicateUrls.has(r.officialUrl) && !r.issues.includes("DUPLICATE_URL")) {
      const cnt = urlCounts.get(r.officialUrl) ?? 0;
      r.issues.push(`DUPLICATE_URL (used ${cnt} times)`);
      if (r.verdict === "CLEAN") r.verdict = "SUSPICIOUS";
    }
  }

  const clean = auditResults.filter(r => r.verdict === "CLEAN");
  const suspicious = auditResults.filter(r => r.verdict === "SUSPICIOUS");
  const bad = auditResults.filter(r => r.verdict === "BAD");

  console.log("=== AUDIT RESULTS (VERIFIED + ACTIVE ONLY) ===");
  console.log(`CLEAN  (no issues detected):            ${clean.length}`);
  console.log(`SUSPICIOUS (possible mismatch):          ${suspicious.length}`);
  console.log(`BAD (placeholder/homepage/synthetic):    ${bad.length}`);
  console.log(`Total audited:                           ${auditResults.length}`);
  console.log(`Duplicate URLs:                          ${duplicateUrls.size}\n`);

  if (duplicateUrls.size > 0) {
    console.log("Top duplicate URLs:");
    for (const [url, count] of [...urlCounts.entries()]
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)) {
      console.log(`  [x${count}] ${url}`);
    }
    console.log("");
  }

  console.log("=== FIRST 20 VERIFIED+ACTIVE RECORDS (MANUAL INSPECTION) ===");
  console.log("Format: [VERDICT] Skill (Level) | Provider | Title | URL | Issues\n");
  for (const r of auditResults.slice(0, 20)) {
    const icon = r.verdict === "CLEAN" ? "[CLEAN]    " : r.verdict === "SUSPICIOUS" ? "[SUSPECT]  " : "[BAD]      ";
    console.log(`${icon} ${r.skillName} (${r.skillLevel})`);
    console.log(`  Provider : ${r.providerName}`);
    console.log(`  Title    : ${r.courseTitle}`);
    console.log(`  URL      : ${r.officialUrl}`);
    if (r.issues.length > 0) console.log(`  Issues   : ${r.issues.join(" | ")}`);
    console.log("");
  }

  if (bad.length > 0) {
    console.log(`=== ALL BAD RECORDS (${bad.length}) ===`);
    for (const r of bad) {
      console.log(`[BAD] [${r.courseId.slice(-8)}] ${r.skillName} (${r.skillLevel})`);
      console.log(`  Provider: ${r.providerName}`);
      console.log(`  URL: ${r.officialUrl}`);
      console.log(`  Issues: ${r.issues.join(" | ")}`);
    }
    console.log("");
  }

  if (suspicious.length > 0) {
    console.log(`=== SUSPICIOUS RECORDS SAMPLE (first 30 of ${suspicious.length}) ===`);
    for (const r of suspicious.slice(0, 30)) {
      console.log(`[SUSPECT] [${r.courseId.slice(-8)}] ${r.skillName} (${r.skillLevel}) | ${r.providerName}`);
      console.log(`  URL: ${r.officialUrl}`);
      console.log(`  Issues: ${r.issues.join(" | ")}`);
    }
    console.log("");
  }

  console.log(`=== STILL PENDING (OFFICIAL_LINK_PENDING + active): ${pendingActive.length} ===`);
  if (pendingActive.length > 0) {
    for (const c of (pendingActive as any[]).slice(0, 20)) {
      console.log(`  [${c.id.slice(-8)}] ${c.skill?.name ?? "?"} (${c.skill?.level?.name ?? "?"}) | ${c.provider?.name ?? "?"} | ${c.officialUrl}`);
    }
    if (pendingActive.length > 20) {
      console.log(`  ... and ${pendingActive.length - 20} more (see audit-report.json)`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: true,
    noDbChanges: true,
    summary: {
      totalInDb: allCourses.length,
      verifiedActive: verifiedActive.length,
      verifiedInactive: verifiedInactive.length,
      pendingActive: pendingActive.length,
      pendingInactive: pendingInactive.length,
      retired: retired.length,
      unavailable: unavailable.length,
      auditClean: clean.length,
      auditSuspicious: suspicious.length,
      auditBad: bad.length,
      duplicateUrlCount: duplicateUrls.size,
    },
    badRecords: bad.map(r => ({
      id: r.courseId, skill: r.skillName, level: r.skillLevel,
      category: r.skillCategory, provider: r.providerName,
      title: r.courseTitle, url: r.officialUrl, issues: r.issues,
    })),
    suspiciousRecords: suspicious.map(r => ({
      id: r.courseId, skill: r.skillName, level: r.skillLevel,
      category: r.skillCategory, provider: r.providerName,
      title: r.courseTitle, url: r.officialUrl, issues: r.issues,
    })),
    duplicateUrlList: [...duplicateUrls].map(url => ({ url, count: urlCounts.get(url) })),
    cleanSample: clean.slice(0, 50).map(r => ({
      skill: r.skillName, level: r.skillLevel, provider: r.providerName,
      title: r.courseTitle, url: r.officialUrl,
    })),
    pendingActiveList: (pendingActive as any[]).map(c => ({
      id: c.id, skill: c.skill?.name, level: c.skill?.level?.name,
      provider: c.provider?.name, url: c.officialUrl,
    })),
  };

  fs.writeFileSync("scripts/audit-report.json", JSON.stringify(report, null, 2), "utf8");
  console.log("\nFull audit report saved to: scripts/audit-report.json");
  console.log("\n=== DRY-RUN COMPLETE. NO DB CHANGES MADE. ===");
}

main()
  .catch(err => {
    console.error("Audit failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
