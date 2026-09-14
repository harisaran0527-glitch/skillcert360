import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function check() {
  const students = await db.studentProfile.findMany({
    include: { user: { select: { email: true, role: true, status: true } } },
    orderBy: { createdAt: "asc" },
  });
  console.log("All students in DB:");
  for (const s of students) {
    console.log(`  id:${s.id}  reg:${s.registerNumber}  email:${s.user.email}  name:${s.fullName}  status:${s.user.status}`);
  }
  // Identify dangling QA test students
  const dangling = students.filter(s => s.registerNumber.startsWith("QADEL") || s.user.email.includes("@qa.test"));
  if (dangling.length > 0) {
    console.log(`\nFound ${dangling.length} dangling QA student(s) to clean up:`);
    for (const s of dangling) {
      console.log(`  Removing: ${s.registerNumber} ${s.user.email}`);
      // Clean cascade order
      await db.activityLog.deleteMany({ where: { studentId: s.id } });
      await db.assessmentViolation.deleteMany({ where: { studentId: s.id } });
      const certs = await db.certificate.findMany({ where: { studentId: s.id }, select: { id: true } });
      if (certs.length > 0) {
        await db.certificateReview.deleteMany({ where: { certificateId: { in: certs.map(c => c.id) } } });
        await db.certificate.deleteMany({ where: { studentId: s.id } });
      }
      await db.assessmentAttempt.deleteMany({ where: { studentId: s.id } });
      await db.studentSkill.deleteMany({ where: { studentId: s.id } });
      const userId = s.userId;
      await db.studentProfile.delete({ where: { id: s.id } });
      await db.user.delete({ where: { id: userId } });
      console.log(`  Removed: ${s.registerNumber}`);
    }
  } else {
    console.log("\nNo dangling QA students found.");
  }
  const finalCount = await db.studentProfile.count();
  console.log(`\nFinal student count: ${finalCount}`);
  await db.$disconnect();
}
check().catch(console.error);
