import { db } from "../src/lib/db";

async function auditTestData() {
  console.log("=== AUDITING DATABASE FOR TEST FIXTURES ===");

  // 1. Audit Users
  const users = await db.user.findMany({
    include: {
      studentProfile: {
        include: {
          department: true,
          section: true,
        },
      },
    },
  });

  console.log(`\nTotal Users: ${users.length}`);

  const testUsers = users.filter((u) => {
    const email = u.email.toLowerCase();
    const name = u.studentProfile?.fullName.toLowerCase() || "";
    const regNo = u.studentProfile?.registerNumber.toUpperCase() || "";

    return (
      email.includes("test") ||
      email.includes("demo") ||
      email.includes("e2e") ||
      email.includes("fixture") ||
      name.includes("test") ||
      name.includes("demo") ||
      name.includes("e2e") ||
      regNo.startsWith("PROG-TEST") ||
      regNo.startsWith("TEST-") ||
      regNo.startsWith("E2E-") ||
      regNo.includes("DEMO")
    );
  });

  console.log(`Identified Test Users (${testUsers.length}):`);
  testUsers.forEach((u) => {
    console.log(
      `  - ID: ${u.id} | Email: ${u.email} | Name: ${u.studentProfile?.fullName || "N/A"} | RegNo: ${u.studentProfile?.registerNumber || "N/A"}`
    );
  });

  const realUsers = users.filter((u) => !testUsers.includes(u));
  console.log(`\nPreserved Real Users (${realUsers.length}):`);
  realUsers.forEach((u) => {
    console.log(
      `  - ID: ${u.id} | Role: ${u.role} | Email: ${u.email} | Name: ${u.studentProfile?.fullName || "N/A"}`
    );
  });

  // 2. Audit Assessment Attempts
  const attempts = await db.assessmentAttempt.findMany({
    include: {
      student: true,
      skill: true,
    },
  });
  console.log(`\nTotal Assessment Attempts: ${attempts.length}`);
  const testAttemptIds = attempts
    .filter(
      (a) =>
        testUsers.some((u) => u.studentProfile?.id === a.studentId) ||
        a.token.includes("test")
    )
    .map((a) => a.id);
  console.log(`Test Attempts to clean: ${testAttemptIds.length}`);

  // 3. Audit Certificates
  const certs = await db.certificate.findMany({
    include: {
      student: true,
      skill: true,
    },
  });
  console.log(`\nTotal Certificates: ${certs.length}`);
  const testCertIds = certs
    .filter((c) =>
      testUsers.some((u) => u.studentProfile?.id === c.studentId)
    )
    .map((c) => c.id);
  console.log(`Test Certificates to clean: ${testCertIds.length}`);

  // 4. Audit Skills & Courses with test prefixes
  const skills = await db.skill.findMany();
  const testSkills = skills.filter(
    (s) =>
      s.slug.startsWith("test-") ||
      s.slug.startsWith("demo-") ||
      s.name.toLowerCase().includes("test skill")
  );
  console.log(`\nTest Skills to clean: ${testSkills.length}`);
  testSkills.forEach((s) => console.log(`  - ${s.id} | ${s.name} (${s.slug})`));

  process.exit(0);
}

auditTestData().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
