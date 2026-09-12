import { db } from "@/lib/db";

export default async function AdminAnalyticsPage() {
  const [students, activeStudents, skillCount, courseCount, assessments, passed, failed, certificatesVerified, certificatesPending] = await Promise.all([
    db.studentProfile.count(),
    db.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
    db.skill.count(),
    db.course.count(),
    db.assessmentAttempt.count(),
    db.assessmentAttempt.count({ where: { passed: true } }),
    db.assessmentAttempt.count({ where: { passed: false } }),
    db.certificate.count({ where: { status: "VERIFIED" } }),
    db.certificate.count({ where: { status: { in: ["PENDING_SUBMISSION", "SUBMITTED", "PENDING_VERIFICATION"] } } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Admin analytics</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">Command center</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Students", students],
          ["Active students", activeStudents],
          ["Skills", skillCount],
          ["Courses", courseCount],
          ["Attempts", assessments],
          ["Passed", passed],
          ["Failed", failed],
          ["Verified certs", certificatesVerified],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 font-display text-3xl font-bold text-[#10233f]">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-[#10233f]">Certificate verification</h2>
        <p className="mt-2 text-sm text-slate-500">Certificates pending: {certificatesPending}</p>
      </div>
    </div>
  );
}
