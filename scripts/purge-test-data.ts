import { db } from "../src/lib/db";

async function purgeTestData() {
  console.log("=== PURGING TEST FIXTURE DATA (PRESERVING REAL RECORDS) ===");

  // 1. Find test users safely using precise patterns
  const users = await db.user.findMany({
    include: {
      studentProfile: true,
    },
  });

  const testUserIds: string[] = [];
  const testStudentProfileIds: string[] = [];

  for (const user of users) {
    const email = user.email.toLowerCase();
    const name = user.studentProfile?.fullName.toLowerCase() || "";
    const regNo = user.studentProfile?.registerNumber.toUpperCase() || "";

    // Strictly match test generated fixtures only
    const isTest =
      email.includes("example.test") ||
      email.startsWith("prog-test-") ||
      email.startsWith("e2e-") ||
      email.startsWith("qa-live-") ||
      regNo.startsWith("PROG-TEST") ||
      regNo.startsWith("E2E-") ||
      regNo.startsWith("QA-LIVE-") ||
      name.startsWith("prog-test") ||
      name.startsWith("e2e-") ||
      name.startsWith("qa-live");

    // Double check to NEVER delete real student or admin accounts
    const isReal =
      email === "saran.ad25@avsenggcollege.ac.in" ||
      email === "yourgmail@gmail.com" ||
      email === "skillcertificate@gmail.com";

    if (isTest && !isReal) {
      testUserIds.push(user.id);
      if (user.studentProfile) {
        testStudentProfileIds.push(user.studentProfile.id);
      }
    }
  }

  console.log(`Identified ${testUserIds.length} test users for purging.`);
  console.log(`Identified ${testStudentProfileIds.length} test student profiles for purging.`);

  if (testUserIds.length === 0) {
    console.log("No test fixture records found to purge.");
    process.exit(0);
  }

  // Execute purge in transaction
  await db.$transaction(async (tx) => {
    // Delete CertificateReviews created by test users/certificates
    const deletedReviews = await tx.certificateReview.deleteMany({
      where: {
        OR: [
          { actorId: { in: testUserIds } },
          { certificate: { studentId: { in: testStudentProfileIds } } },
        ],
      },
    });
    console.log(`Deleted ${deletedReviews.count} test certificate reviews.`);

    // Delete Certificates of test students
    const deletedCerts = await tx.certificate.deleteMany({
      where: {
        studentId: { in: testStudentProfileIds },
      },
    });
    console.log(`Deleted ${deletedCerts.count} test certificates.`);

    // Delete AssessmentAnswers of test attempts
    const deletedAnswers = await tx.assessmentAnswer.deleteMany({
      where: {
        attempt: { studentId: { in: testStudentProfileIds } },
      },
    });
    console.log(`Deleted ${deletedAnswers.count} test assessment answers.`);

    // Delete AssessmentViolations of test attempts
    const deletedViolations = await tx.assessmentViolation.deleteMany({
      where: {
        studentId: { in: testStudentProfileIds },
      },
    });
    console.log(`Deleted ${deletedViolations.count} test assessment violations.`);

    // Delete AssessmentAttempts of test students
    const deletedAttempts = await tx.assessmentAttempt.deleteMany({
      where: {
        studentId: { in: testStudentProfileIds },
      },
    });
    console.log(`Deleted ${deletedAttempts.count} test assessment attempts.`);

    // Delete CourseProgress of test students
    const deletedCourseProgress = await tx.courseProgress.deleteMany({
      where: {
        studentSkill: { studentId: { in: testStudentProfileIds } },
      },
    });
    console.log(`Deleted ${deletedCourseProgress.count} test course progress records.`);

    // Delete StudentSkills of test students
    const deletedStudentSkills = await tx.studentSkill.deleteMany({
      where: {
        studentId: { in: testStudentProfileIds },
      },
    });
    console.log(`Deleted ${deletedStudentSkills.count} test student skills.`);

    // Delete ActivityLogs of test users/students
    const deletedLogs = await tx.activityLog.deleteMany({
      where: {
        OR: [
          { userId: { in: testUserIds } },
          { studentId: { in: testStudentProfileIds } },
        ],
      },
    });
    console.log(`Deleted ${deletedLogs.count} test activity logs.`);

    // Delete StudentProfiles
    const deletedProfiles = await tx.studentProfile.deleteMany({
      where: {
        id: { in: testStudentProfileIds },
      },
    });
    console.log(`Deleted ${deletedProfiles.count} test student profiles.`);

    // Delete Users
    const deletedUsers = await tx.user.deleteMany({
      where: {
        id: { in: testUserIds },
      },
    });
    console.log(`Deleted ${deletedUsers.count} test user accounts.`);
  });

  // Verify remaining real records
  const remainingUsers = await db.user.findMany({
    include: { studentProfile: true },
  });

  console.log("\n=== PURGE COMPLETE ===");
  console.log(`Remaining Real Users Count: ${remainingUsers.length}`);
  remainingUsers.forEach((u) => {
    console.log(`  - [${u.role}] ${u.email} (${u.studentProfile?.fullName || "Admin"})`);
  });

  process.exit(0);
}

purgeTestData().catch((err) => {
  console.error("Purge failed:", err);
  process.exit(1);
});
