import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { canDownloadCertificate } from "@/lib/certificate-eligibility";
import { CertificateRequestModalForm } from "@/components/certificate-request-form";

export default async function CertificateRequestPage({ params }: { params: Promise<{ skillId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");
  const { skillId } = await params;
  const profile = await db.studentProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) redirect("/student/login");
  const enrollment = await db.studentSkill.findUnique({
    where: { studentId_skillId: { studentId: profile.id, skillId } },
    include: { skill: true, selectedCourse: { include: { provider: true } } },
  });
  if (!enrollment) notFound();
  if (!enrollment.completedAt || !enrollment.selectedCourse) redirect(`/student/skills/${enrollment.skill.slug}`);
  const [certificate, passAttempt, latestAttempt] = await Promise.all([
    db.certificate.findUnique({ where: { studentId_skillId: { studentId: profile.id, skillId } } }),
    db.assessmentAttempt.findFirst({ where: { studentId: profile.id, skillId, passed: true, terminated: false, NOT: { submittedAt: null } } }),
    db.assessmentAttempt.findFirst({ where: { studentId: profile.id, skillId }, orderBy: { startedAt: "desc" } }),
  ]);
  const course = enrollment.selectedCourse;
  return <div className="mx-auto max-w-2xl space-y-5 pb-12">
    <Link href={`/student/skills/${enrollment.skill.slug}`} className="text-xs text-cyan-300">Back to Course</Link>
    <CertificateRequestModalForm key={`${skillId}:${Boolean(certificate?.submittedAt)}`} studentName={profile.fullName} registerNumber={profile.registerNumber}
      skillId={skillId} courseId={course.id} courseTitle={course.title ?? course.name} providerName={course.provider.name}
      isSubmitted={Boolean(certificate?.submittedAt && certificate.courseId === course.id)} assessmentPassed={Boolean(passAttempt)}
      assessmentFailed={!passAttempt && latestAttempt?.passed === false} certificateAvailable={certificate ? await canDownloadCertificate(certificate) : false} />
  </div>;
}
