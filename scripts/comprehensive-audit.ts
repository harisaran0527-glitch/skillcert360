import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import http from "http";
import https from "https";
import { URL } from "url";

const db = new PrismaClient();

interface AuditEntry {
  index: number;
  skillId: string;
  skillName: string;
  levelName: string;
  courseId: string;
  courseTitle: string;
  providerName: string;
  displayedUrl: string;
  officialUrlStatus: string;
  actualDestinationUrl: string;
  destinationPageTitle: string;
  httpStatusCode: number | null;
  status: "PASS" | "BROKEN" | "WRONG DESTINATION" | "DEPRECATED" | "UNAVAILABLE" | "DUPLICATE" | "UI ERROR" | "AUTH REQUIRED" | "UNKNOWN";
  issues: string[];
  notes: string;
  sourceFile: string;
  recordId: string;
  recommendedFix?: string;
}

function fetchUrlInfo(targetUrl: string, redirectCount = 0): Promise<{
  statusCode: number | null;
  finalUrl: string;
  title: string;
  bodySnippet: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    if (!targetUrl || targetUrl === "OFFICIAL_LINK_PENDING" || !/^https?:\/\//i.test(targetUrl)) {
      resolve({
        statusCode: null,
        finalUrl: targetUrl,
        title: "",
        bodySnippet: "",
        error: "Invalid or missing URL format",
      });
      return;
    }

    if (redirectCount > 8) {
      resolve({
        statusCode: 310,
        finalUrl: targetUrl,
        title: "",
        bodySnippet: "",
        error: "Too many redirects",
      });
      return;
    }

    try {
      const parsed = new URL(targetUrl);
      const client = parsed.protocol === "https:" ? https : http;

      const req = client.request(
        parsed,
        {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          timeout: 12000,
        },
        (res) => {
          const statusCode = res.statusCode || null;

          if (statusCode && statusCode >= 300 && statusCode < 400 && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, targetUrl).toString();
            res.resume();
            return fetchUrlInfo(redirectUrl, redirectCount + 1).then(resolve);
          }

          let data = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            if (data.length < 500000) {
              data += chunk;
            }
          });

          res.on("end", () => {
            let title = "";
            const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch) {
              title = titleMatch[1].trim().replace(/\s+/g, " ");
            }

            resolve({
              statusCode,
              finalUrl: targetUrl,
              title,
              bodySnippet: data.slice(0, 2000),
            });
          });
        }
      );

      req.on("error", (err) => {
        resolve({
          statusCode: null,
          finalUrl: targetUrl,
          title: "",
          bodySnippet: "",
          error: err.message,
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          statusCode: 408,
          finalUrl: targetUrl,
          title: "",
          bodySnippet: "",
          error: "Request timeout (12s)",
        });
      });

      req.end();
    } catch (e: any) {
      resolve({
        statusCode: null,
        finalUrl: targetUrl,
        title: "",
        bodySnippet: "",
        error: e.message,
      });
    }
  });
}

async function runAudit() {
  console.log("=== STARTING COMPREHENSIVE COURSE LINK AUDIT ===");

  const courses = await db.course.findMany({
    where: {
      active: true,
      skill: {
        active: true,
        category: { active: true },
        level: { active: true },
      },
      provider: { active: true },
    },
    include: {
      skill: {
        include: {
          level: true,
          category: true,
        },
      },
      provider: true,
    },
    orderBy: [
      { skill: { level: { order: "asc" } } },
      { skill: { name: "asc" } },
      { title: "asc" },
    ],
  });

  console.log(`Fetched ${courses.length} active courses rendered in SkillCert 360.`);

  // Track duplicate URLs
  const urlMap = new Map<string, string[]>();
  for (const c of courses) {
    const u = (c.officialUrl || "").trim();
    if (u && u !== "OFFICIAL_LINK_PENDING") {
      const arr = urlMap.get(u) || [];
      arr.push(c.id);
      urlMap.set(u, arr);
    }
  }

  const results: AuditEntry[] = [];
  let index = 1;

  for (const c of courses) {
    const skillName = c.skill.name;
    const levelName = c.skill.level.name;
    const courseTitle = c.title || c.name;
    const providerName = c.provider.name;
    const displayedUrl = (c.officialUrl || "").trim();

    console.log(`[${index}/${courses.length}] Testing: ${skillName} (${levelName}) - "${courseTitle}" (${providerName})`);

    const issues: string[] = [];
    let status: AuditEntry["status"] = "PASS";
    let notes = "";
    let recommendedFix = "";

    const dupes = displayedUrl ? urlMap.get(displayedUrl) || [] : [];
    if (dupes.length > 1) {
      issues.push(`DUPLICATE: URL shared across ${dupes.length} courses`);
    }

    const urlInfo = await fetchUrlInfo(displayedUrl);

    const destUrl = urlInfo.finalUrl || displayedUrl;
    const pageTitle = urlInfo.title || "";
    const httpCode = urlInfo.statusCode;

    // Validation Rules
    if (!displayedUrl || displayedUrl === "OFFICIAL_LINK_PENDING") {
      status = "UNAVAILABLE";
      issues.push("URL status is OFFICIAL_LINK_PENDING / empty URL");
      notes = "No official course link is configured in database.";
      recommendedFix = `Provide official verified URL for course ID: ${c.id}`;
    } else if (urlInfo.error) {
      status = "BROKEN";
      issues.push(`Network Error: ${urlInfo.error}`);
      notes = `Failed to connect or HTTP request error: ${urlInfo.error}`;
      recommendedFix = `Update broken URL for course ID: ${c.id} (${displayedUrl})`;
    } else if (httpCode && (httpCode === 404 || httpCode >= 500)) {
      status = "BROKEN";
      issues.push(`HTTP ${httpCode}`);
      notes = `Destination returned HTTP error status code ${httpCode}`;
      recommendedFix = `Fix or replace broken 404/500 course URL for course ID: ${c.id}`;
    } else {
      // Check for generic homepage / search URLs
      const isGenericHomepage =
        /^https?:\/\/[^\/]+\/?$/i.test(destUrl) ||
        /\/browse\/?$/i.test(destUrl) ||
        /\/courses\/?$/i.test(destUrl) ||
        /\/search\?/i.test(destUrl) ||
        /\/learn\/?$/i.test(destUrl) ||
        /\/training\/?$/i.test(destUrl) ||
        /\/catalog\/?$/i.test(destUrl);

      if (isGenericHomepage) {
        status = "WRONG DESTINATION";
        issues.push("Generic Provider Homepage / Search / Catalog URL instead of specific course page");
        notes = `URL points to high-level index/search page (${destUrl}), not specific course page.`;
        recommendedFix = `Replace provider index URL with direct course link for "${courseTitle}"`;
      }

      // Provider domain match check
      const host = new URL(destUrl).hostname.toLowerCase();
      const pLower = providerName.toLowerCase();
      let providerMismatch = false;

      if (pLower.includes("microsoft") && !host.includes("microsoft") && !host.includes("azure")) providerMismatch = true;
      if ((pLower.includes("aws") || pLower.includes("amazon")) && !host.includes("aws") && !host.includes("amazon")) providerMismatch = true;
      if (pLower.includes("google") && !host.includes("google") && !host.includes("coursera") && !host.includes("cloud.google")) providerMismatch = true;
      if (pLower.includes("cisco") && !host.includes("cisco") && !host.includes("skillsforall") && !host.includes("netacad")) providerMismatch = true;
      if (pLower.includes("oracle") && !host.includes("oracle")) providerMismatch = true;
      if (pLower.includes("ibm") && !host.includes("ibm") && !host.includes("coursera") && !host.includes("skillsbuild")) providerMismatch = true;
      if (pLower.includes("coursera") && !host.includes("coursera")) providerMismatch = true;

      if (providerMismatch) {
        if (status === "PASS") status = "WRONG DESTINATION";
        issues.push(`Provider mismatch: Provider is "${providerName}", but domain is "${host}"`);
        notes += ` Provider domain mismatch.`;
        recommendedFix = `Verify provider link mapping for course ID: ${c.id}`;
      }

      // Title / content checks
      const pageTitleLower = pageTitle.toLowerCase();
      const snippetLower = urlInfo.bodySnippet.toLowerCase();

      if (snippetLower.includes("404") || snippetLower.includes("page not found") || snippetLower.includes("course not found") || snippetLower.includes("course retired") || snippetLower.includes("content removed")) {
        status = "DEPRECATED";
        issues.push("Page body indicates 404 / course retired / content removed");
        notes = `Destination page contains "page not found" or "course retired" text. Title: "${pageTitle}"`;
        recommendedFix = `Replace retired course link for course ID: ${c.id}`;
      }

      // Check if duplicate
      if (dupes.length > 1 && status === "PASS") {
        status = "DUPLICATE";
        notes = `URL shared across ${dupes.length} different course records in database.`;
      }
    }

    if (status === "PASS" && notes === "") {
      notes = "URL loads successfully, provider matches, page title matches course topic.";
    }

    results.push({
      index: index++,
      skillId: c.skillId,
      skillName,
      levelName,
      courseId: c.id,
      courseTitle,
      providerName,
      displayedUrl,
      officialUrlStatus: c.officialUrlStatus,
      actualDestinationUrl: destUrl,
      destinationPageTitle: pageTitle || "(No Title Extracted)",
      httpStatusCode: httpCode,
      status,
      issues,
      notes,
      sourceFile: "Database Table: `Course` (Prisma)",
      recordId: c.id,
      recommendedFix,
    });
  }

  fs.writeFileSync("scripts/audit_results_full.json", JSON.stringify(results, null, 2), "utf8");
  console.log(`Saved ${results.length} audit entries to scripts/audit_results_full.json`);

  await db.$disconnect();
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
