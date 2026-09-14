import type { Certificate } from "@prisma/client";
import { db } from "@/lib/db";

export async function hasPassedCertificateAssessment(certificate: Pick<Certificate, "studentId" | "skillId" | "courseId">) {
  const [enrollment, attempt] = await Promise.all([
    db.studentSkill.findUnique({
      where: { studentId_skillId: { studentId: certificate.studentId, skillId: certificate.skillId } },
      include: { selectedCourse: { select: { skillId: true } } },
    }),
    db.assessmentAttempt.findFirst({
      where: {
        studentId: certificate.studentId,
        skillId: certificate.skillId,
        passed: true,
        terminated: false,
        NOT: { submittedAt: null },
      },
    }),
  ]);
  // Assessments use the selected course's mapped skill bank. Learning prevents
  // changing that course after completion or any attempt.
  return Boolean(enrollment?.completedAt && certificate.courseId &&
    enrollment.selectedCourseId === certificate.courseId && enrollment.selectedCourse?.skillId === certificate.skillId &&
    attempt);
}

export async function canDownloadCertificate(certificate: Pick<Certificate, "studentId" | "skillId" | "courseId" | "status">) {
  return ["UNLOCKED", "VERIFIED"].includes(certificate.status) && await hasPassedCertificateAssessment(certificate);
}
