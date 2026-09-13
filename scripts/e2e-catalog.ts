import type { PrismaClient } from "@prisma/client";
import { expect as baseExpect, type Page } from "@playwright/test";
import { pathToFileURL } from "node:url";
const expect = baseExpect.configure({ timeout: 20000 });

export async function catalogueChecks(db: PrismaClient, admin: Page, student: Page, fixture: { skillId: string; courseId: string; providerId: string; studentId: string; tag: string }, check: (message: string) => void) {
  const base = process.env.E2E_BASE_URL || "http://localhost:3000";
  const skill = await db.skill.findUniqueOrThrow({ where: { id: fixture.skillId } });
  const originalCourse = await db.course.findUniqueOrThrow({ where: { id: fixture.courseId } });
  const providerName = fixture.tag + " Catalogue Provider";
  const courseName = fixture.tag + " Second Course";
  let extraProviderId = "";
  let extraCourseId = "";
  const postLearning = (data: object) => student.request.post(base + "/api/student/learning", { data, maxRedirects: 0 });
  try {
    for (const term of ["C", "C++", "Python", "Java", "JavaScript", "AI", "Cloud", "Cybersecurity", "Data Science"]) {
      await student.goto(base + "/student/skills?q=" + encodeURIComponent(term));
      expect(await student.locator('h3 a[href^="/student/skills/"]').count()).toBeGreaterThan(0);
      expect(await student.locator('h3 a[href^="/student/skills/"]').count()).toBeLessThanOrEqual(24);
    }
    check("Skill-first search finds C, C++, Python, Java, JavaScript, AI, Cloud, Cybersecurity and Data Science in bounded pages");
    await student.goto(base + "/student/skills?page=invalid&state=unlocked");
    await expect(student.getByText("Level Restricted", { exact: true })).toHaveCount(0);
    await student.getByRole("link", { name: /Next/ }).click();
    expect(student.url()).toContain("state=unlocked");
    expect(student.url()).toContain("page=2");
    await student.goto(base + "/student/skills?state=locked");
    expect(await student.getByText("Level Restricted", { exact: true }).count()).toBeGreaterThan(0);
    await student.goto(base + "/student/skills?q=no-match-" + fixture.tag);
    await expect(student.getByText("No skills match your filters.")).toBeVisible();
    check("Access filters, empty search, invalid page handling and filter-preserving pagination work");

    await admin.goto(base + "/admin/skills?edit=" + skill.id);
    const skillForm = admin.locator('form[action="/api/admin/skills"]');
    await skillForm.locator('[name="description"]').fill("Catalogue edit test");
    await skillForm.locator('[name="active"]').selectOption("false");
    await skillForm.getByRole("button").click();
    await admin.waitForURL(/saved=1/);
    expect((await db.skill.findUniqueOrThrow({ where: { id: skill.id } })).active).toBe(false);
    await student.goto(base + "/student/skills?q=" + encodeURIComponent(skill.name));
    await expect(student.getByText("No skills match your filters.")).toBeVisible();
    await admin.goto(base + "/admin/skills?edit=" + skill.id);
    await skillForm.locator('[name="active"]').selectOption("true");
    await skillForm.getByRole("button").click();
    await admin.waitForURL(/saved=1/);
    await admin.goto(base + `/admin/skills?q=${fixture.tag}&category=${skill.categoryId}&level=${skill.levelId}&active=true`);
    await expect(admin.getByRole("link", { name: "1 linked courses" })).toBeVisible();
    await admin.getByRole("link", { name: "1 linked courses" }).click();
    await expect(admin.getByRole("heading", { name: originalCourse.name })).toBeVisible();
    check("Admin skill editing, category/level/status filters and linked-course navigation persist correctly");

    await admin.goto(base + "/admin/providers");
    const providerForm = admin.locator('form[action="/api/admin/providers"]');
    await providerForm.locator('[name="name"]').fill(providerName);
    await providerForm.locator('[name="slug"]').fill(fixture.tag.toLowerCase() + "-catalogue");
    await providerForm.locator('[name="website"]').fill("https://developer.mozilla.org");
    await providerForm.getByRole("button").click();
    await admin.waitForURL(/saved=1/);
    const provider = await db.provider.findUniqueOrThrow({ where: { name: providerName } });
    extraProviderId = provider.id;
    expect(provider.officialWebsite).toBe("https://developer.mozilla.org");
    expect(provider.slug).toBe(fixture.tag.toLowerCase() + "-catalogue");
    check("Admin creates provider with official website and unique slug");

    await admin.goto(base + "/admin/courses?skill=" + skill.id);
    const courseForm = admin.locator('form[action="/api/admin/courses"]');
    await courseForm.locator('[name="name"]').fill(courseName);
    await courseForm.getByRole("searchbox", { name: "Find target skill" }).fill(fixture.tag);
    await expect(courseForm.locator('[name="skillId"] option', { hasText: skill.name })).toHaveCount(1);
    await courseForm.locator('[name="skillId"]').selectOption(skill.id);
    await courseForm.locator('[name="providerId"]').selectOption(provider.id);
    await courseForm.locator('[name="levelId"]').selectOption(skill.levelId);
    await courseForm.locator('[name="officialUrl"]').fill("https://developer.mozilla.org/en-US/docs/Web/JavaScript");
    await courseForm.locator('[name="officialUrlStatus"]').selectOption("VERIFIED");
    await courseForm.locator('[name="duration"]').fill("3 hours");
    await courseForm.locator('[name="pricingType"]').selectOption("PAID");
    await courseForm.locator('[name="credentialAvailable"]').selectOption("true");
    await courseForm.locator('[name="credentialType"]').selectOption("DIGITAL_BADGE");
    await courseForm.getByRole("button").click();
    await admin.waitForURL(/saved=1/);
    const course = await db.course.findFirstOrThrow({ where: { name: courseName } });
    extraCourseId = course.id;
    expect(course).toMatchObject({ skillId: skill.id, providerId: provider.id, title: courseName, officialUrlStatus: "VERIFIED", duration: "3 hours", pricingType: "PAID", credentialAvailable: true, credentialType: "DIGITAL_BADGE", active: true });
    check("Admin creates fully described provider course using bounded skill search");

    await student.goto(base + `/student/skills?category=${skill.categoryId}&level=${skill.levelId}&provider=${provider.id}&price=paid&credential=yes`);
    const card = student.locator('h3', { hasText: skill.name }).locator('..').locator('..').locator('..');
    await expect(card.getByText("Providers", { exact: true }).locator('..')).toContainText("2");
    await expect(card.getByText("Courses", { exact: true }).locator('..')).toContainText("2");
    await expect(card.getByText("Credential", { exact: true }).locator('..')).toContainText("1");
    await student.getByRole("link", { name: "Explore Skill", exact: true }).click();
    await expect(student.getByRole("heading", { name: originalCourse.name })).toBeVisible();
    await expect(student.getByRole("heading", { name: courseName })).toBeVisible();
    await expect(student.getByText("3 hours", { exact: true })).toBeVisible();
    await expect(student.getByText("Digital Badge", { exact: true })).toBeVisible();
    check("Combined catalogue filters and card provider/course/credential counts agree; detail displays both provider options");

    expect((await postLearning({ skillId: skill.id, action: "learn" })).status()).toBe(400);
    const unrelatedCourse = await db.course.findFirstOrThrow({ where: { skillId: { not: skill.id } } });
    expect((await postLearning({ skillId: skill.id, courseId: unrelatedCourse.id, action: "learn" })).status()).toBe(400);
    expect((await postLearning({ skillId: skill.id, courseId: originalCourse.id, action: "learn" })).status()).toBe(200);
    await student.reload();
    const secondCard = student.getByRole("heading", { name: courseName }).locator('..').locator('..').locator('..');
    const [popup] = await Promise.all([student.waitForEvent("popup"), secondCard.getByRole("button", { name: "Learn Officially" }).click()]);
    await popup.close();
    const enrollment = await db.studentSkill.findUniqueOrThrow({ where: { studentId_skillId: { studentId: fixture.studentId, skillId: skill.id } }, include: { selectedCourse: true } });
    expect(enrollment.selectedCourseId).toBe(course.id);
    expect(enrollment.selectedCourse?.providerId).toBe(provider.id);
    await student.reload();
    await expect(student.getByText("Your Selected Course", { exact: true })).toBeVisible();
    await student.getByRole("button", { name: "Mark Learning Complete", exact: true }).click();
    await expect(student.getByRole("button", { name: "Start Assessment", exact: true })).toBeVisible();
    const progress = await db.courseProgress.findMany({ where: { studentSkillId: enrollment.id } });
    expect(progress).toHaveLength(2);
    expect(progress.find(item => item.courseId === course.id)?.completedAt).not.toBeNull();
    expect(progress.find(item => item.courseId === originalCourse.id)?.completedAt).toBeNull();
    expect((await postLearning({ skillId: skill.id, courseId: originalCourse.id, action: "learn" })).status()).toBe(409);
    check("Course choice and provider persist, only the selected course completes, and completed attribution cannot be switched");

    await admin.goto(base + "/admin/courses?edit=" + course.id);
    await courseForm.locator('[name="officialUrlStatus"]').selectOption("RETIRED");
    await courseForm.locator('[name="pricingType"]').selectOption("SUBSCRIPTION");
    await courseForm.getByRole("button").click();
    await admin.waitForURL(/saved=1/);
    expect((await db.course.findUniqueOrThrow({ where: { id: course.id } })).pricingType).toBe("SUBSCRIPTION");
    expect((await postLearning({ skillId: skill.id, courseId: course.id, action: "learn" })).status()).toBe(400);
    await admin.goto(base + `/admin/courses?provider=${provider.id}&urlStatus=RETIRED&active=true`);
    await expect(admin.getByRole("heading", { name: courseName })).toBeVisible();
    await admin.goto(base + "/admin/providers?edit=" + provider.id);
    await providerForm.locator('[name="active"]').selectOption("false");
    await providerForm.getByRole("button").click();
    await admin.waitForURL(/saved=1/);
    await student.goto(base + "/student/skills/" + skill.slug);
    await expect(student.getByRole("heading", { name: courseName })).toHaveCount(0);
    check("Admin course metadata edits and filters persist; retired courses and inactive providers cannot be selected");
    expect((await student.request.get(base + "/api/admin/skills?q=Python")).status()).toBe(403);
    for (const resource of ["skills", "courses", "providers"]) expect((await student.request.post(base + "/api/admin/" + resource, { form: {} })).status()).toBe(403);
    check("Student access to catalogue admin lookup and mutations is forbidden");
    await admin.screenshot({ path: "test-results/catalog-admin.png", fullPage: true });
    await student.screenshot({ path: "test-results/catalog-detail.png", fullPage: true });
  } finally {
    if (extraCourseId) { await db.courseProgress.deleteMany({ where: { courseId: extraCourseId } }); await db.course.delete({ where: { id: extraCourseId } }); }
    if (extraProviderId) await db.provider.delete({ where: { id: extraProviderId } });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  import("./e2e-workflow").then(({ runWorkflow }) => runWorkflow("catalogue")).catch(error => { console.error(error); process.exitCode = 1; });
}
