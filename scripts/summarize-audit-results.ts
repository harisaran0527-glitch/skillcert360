import fs from "fs";

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
  status: string;
  issues: string[];
  notes: string;
  sourceFile: string;
  recordId: string;
  recommendedFix?: string;
}

const raw = fs.readFileSync("scripts/audit_results_full.json", "utf8");
const results: AuditEntry[] = JSON.parse(raw);

const statusCounts: Record<string, number> = {};
for (const r of results) {
  statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
}

console.log("=== FINAL AUDIT METRICS ===");
console.log(`TOTAL COURSE LINKS TESTED: ${results.length}`);
console.log("STATUS BREAKDOWN:", statusCounts);

const nonPass = results.filter(r => r.status !== "PASS");
console.log(`TOTAL NON-PASS ITEMS: ${nonPass.length}`);

// Write formatted summary json
const summary = {
  totalTested: results.length,
  statusCounts,
  nonPassCount: nonPass.length,
  nonPassItems: nonPass,
};

fs.writeFileSync("scripts/audit_summary_final.json", JSON.stringify(summary, null, 2), "utf8");
