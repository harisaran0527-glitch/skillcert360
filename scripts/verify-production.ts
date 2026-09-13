import "dotenv/config";
import { expect as baseExpect, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { launchSecurityBrowser } from "./e2e-browser";
import { VALID_SECTIONS } from "../src/lib/ui-options";
import { PrismaClient } from "@prisma/client";

const expect = baseExpect.configure({ timeout: 30000 });
const base = process.argv[2] || "https://skillcert360.vercel.app";
const checks: string[] = [];
const pageErrors: string[] = [];
const record = (message: string) => { checks.push(message); console.log("PASS " + message); };
const fixturePattern = /^(?:testing|test|demo|sample|e2e|prog-test)(?:$|[-_ ])/i;

async function verifySelects(page: Page) {
  const selects = await page.locator("select").evaluateAll(elements => elements.map(element => {
    const select = element as HTMLSelectElement;
    return { name: select.name, options: Array.from(select.options).filter(option => option.value).map(option => ({ value: option.value, label: option.text.trim() })) };
  }));
  for (const select of selects) {
    expect(new Set(select.options.map(option => option.value)).size).toBe(select.options.length);
    expect(new Set(select.options.map(option => option.label.toLowerCase())).size).toBe(select.options.length);
    if (["section", "sectionName", "sectionId"].includes(select.name)) {
      expect(select.options.map(option => option.label)).toEqual([...VALID_SECTIONS]);
      expect(select.options.map(option => option.value)).toEqual([...VALID_SECTIONS]);
    }
    if (["department", "departmentId", "dept"].includes(select.name)) expect(select.options.some(option => fixturePattern.test(option.label))).toBe(false);
  }
}

async function main() {
  await mkdir("test-results", { recursive: true });
  const { browser, close } = await launchSecurityBrowser();
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  admin.on("pageerror", error => pageErrors.push(error.message));
  let studentLoginVerified = false;
  try {
    await admin.goto(base + "/admin/login");
    await admin.locator('[name="identifier"]').fill(process.env.SEED_ADMIN_EMAIL || "");
    await admin.locator('[name="password"]').fill(process.env.SEED_ADMIN_PASSWORD || "");
    await admin.locator('form[action="/api/auth/admin/login"] button[type="submit"]').click();
    await admin.waitForURL(/\/admin\/dashboard/);
    record("Live admin login succeeds");
    expect((await adminContext.request.get(base + "/admin/departments", { maxRedirects: 0 })).status()).toBe(404);
    const navigation = await admin.locator('aside a[href^="/admin/"]').evaluateAll(links => links.map(link => ({ href: link.getAttribute("href"), label: link.textContent?.trim() })));
    expect(new Set(navigation.map(link => link.href)).size).toBe(navigation.length);
    expect(navigation.some(link => /department/i.test(link.label || ""))).toBe(false);
    record("Departments route is absent; sidebar has no Departments item or duplicate navigation links");
    const dashboardLabels = await admin.locator('section.grid > div > div > p').allTextContents();
    expect(new Set(dashboardLabels).size).toBe(dashboardLabels.length);
    record("Admin dashboard has no duplicate metric labels");

    for (const path of ["students", "assessments", "analytics", "skills", "courses", "providers", "questions", "certificates"]) {
      const response = await admin.goto(base + "/admin/" + path);
      expect(response?.status()).toBe(200);
      await verifySelects(admin);
      const cards = await admin.locator("h3").evaluateAll(headings => headings.map(heading => heading.closest(".glass-panel")?.textContent?.trim()).filter(Boolean));
      expect(new Set(cards).size).toBe(cards.length);
      expect((await admin.locator("h3").allTextContents()).some(title => fixturePattern.test(title.trim()))).toBe(false);
      record("Live " + path + " page loads with unique options/cards and production data");
    }
    await admin.goto(base + "/admin/students");
    const detail = admin.locator('a[href^="/admin/students/"]').first();
    if (await detail.count()) await detail.click();
    else {
      // Fixture records are intentionally absent from the directory, but must remain intact.
      const db = new PrismaClient();
      const existing = await db.studentProfile.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }).finally(() => db.$disconnect());
      expect(existing).not.toBeNull();
      expect((await admin.goto(base + "/admin/students/" + existing!.id))?.status()).toBe(200);
      record("Preserved historical student remains accessible while fixtures are hidden from the production directory");
    }
    await expect(admin.locator('[name="fullName"]')).not.toHaveValue("");
    await verifySelects(admin);
    await expect(admin.getByText(/4-Level Progression Standing/)).toBeVisible();
    await expect(admin.getByText(/Assessment Attempts & Security Log/)).toBeVisible();
    record("Existing student and Student 360 load; edit sections are only A/B/C; progression and assessment records render");
    await admin.screenshot({ path: "test-results/live-student-360.png", fullPage: true });

    const studentContext = await browser.newContext();
    const student = await studentContext.newPage();
    student.on("pageerror", error => pageErrors.push(error.message));
    expect((await student.goto(base + "/student/login"))?.status()).toBe(200);
    await expect(student.locator('[name="identifier"]')).toBeVisible();
    await expect(student.locator('[name="password"]')).toBeVisible();
    record("Live student login page renders correctly");
    if (process.env.LIVE_STUDENT_IDENTIFIER && process.env.LIVE_STUDENT_PASSWORD) {
      await student.locator('[name="identifier"]').fill(process.env.LIVE_STUDENT_IDENTIFIER);
      await student.locator('[name="password"]').fill(process.env.LIVE_STUDENT_PASSWORD);
      await student.locator('form[action="/api/auth/student/login"] button[type="submit"]').click();
      await student.waitForURL(/\/student\/dashboard/);
      studentLoginVerified = true;
      for (const path of ["dashboard", "skills", "my-learning", "assessment", "certificates", "profile"]) {
        expect((await student.goto(base + "/student/" + path))?.status()).toBe(200);
        await verifySelects(student);
      }
      record("Live student login succeeds; catalogue, learning, assessment, credential and profile pages load");
    } else console.log("PENDING: Successful student login requires an existing student test account.");
    expect(pageErrors).toEqual([]);
    record("No client-side page errors during live verification");
  } finally {
    await writeFile("test-results/production-verification.json", JSON.stringify({ base, checks, pageErrors, studentLoginVerified, recordEdits: 0, verifiedAt: new Date().toISOString() }, null, 2));
    await close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
