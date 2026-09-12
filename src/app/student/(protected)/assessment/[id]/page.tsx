import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { expireStudentAttempts } from "@/lib/assessment";
import { StudentAssessmentClient } from "@/components/student-assessment";
export default async function StudentAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
 const session = await getSession();
 if (!session || session.mustChangePassword || session.role !== "STUDENT") redirect("/student/login");
 const { id } = await params;
 const attempt = await db.assessmentAttempt.findFirst({ where: { id, student: { userId: session.userId } }, include: { student: true } });
 if (!attempt) redirect("/student/dashboard");
 await expireStudentAttempts(attempt.studentId);
 if (attempt.submittedAt || attempt.expiresAt <= new Date()) redirect(`/student/results/${id}`);
 return <StudentAssessmentClient attemptId={id} studentName={attempt.student.fullName} registerNumber={attempt.student.registerNumber} />;
}
