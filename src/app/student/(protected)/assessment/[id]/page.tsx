import { displaySection } from "@/lib/ui-options";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { expireStudentAttempts } from "@/lib/assessment";
import { StudentAssessmentClient } from "@/components/student-assessment";

export default async function StudentAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "STUDENT") redirect("/student/login");

  const { id } = await params;
  const attempt = await db.assessmentAttempt.findFirst({
    where: { id, student: { userId: session.userId } },
    include: {
      student: {
        include: {
          department: true,
          section: true,
          user: true,
        },
      },
      skill: {
        include: {
          level: true,
        },
      },
    },
  });

  if (!attempt) redirect("/student/dashboard");
  await expireStudentAttempts(attempt.studentId);
  if (attempt.submittedAt || attempt.expiresAt <= new Date()) redirect(`/student/results/${id}`);

  return (
    <StudentAssessmentClient
      attemptId={id}
      studentName={attempt.student.fullName}
      registerNumber={attempt.student.registerNumber}
      studentEmail={attempt.student.user?.email || ""}
      departmentName={attempt.student.department.name}
      yearSection={`Year ${attempt.student.year} · Section ${displaySection(attempt.student.section.name)}`}
    />
  );
}
