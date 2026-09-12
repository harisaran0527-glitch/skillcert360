import { expireStudentAttempts } from "@/lib/assessment";
import { getSkillProgressState } from "@/lib/progress";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export default async function AdminStudent360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await expireStudentAttempts(id);
  const profile = await db.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      department: true,
      section: true,
      skills: { include: { skill: true, courseProgress: { include: { course: { include: { provider: true } } } } } },
      attempts: { include: { skill: true, violations: { orderBy: { occurredAt: "asc" } } }, orderBy: { startedAt: "asc" } },
      certificates: { include: { skill: true, verifiedBy: { select: { email: true } }, reviews: { include: { actor: { select: { email: true } } }, orderBy: { createdAt: "asc" } } } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) notFound();

  const states = Object.fromEntries(await Promise.all(profile.skills.map(async entry => [entry.skillId, await getSkillProgressState(id, entry.skillId)])));
  return (
    <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Admin 360</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">{profile.fullName}</h1>
        </div>
        <Link href="/admin/students" className="text-sm font-semibold text-[#1e6fd9]">← Students</Link>
      </div>

      <p>{profile.registerNumber} · {profile.user.email} · Joined: {profile.createdAt.toLocaleString()} · Last login: {profile.user.lastLoginAt?.toLocaleString() ?? "Never"}</p><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Department</p><p className="mt-2 font-bold text-[#10233f]">{profile.department.name}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Year</p><p className="mt-2 font-bold text-[#10233f]">{profile.year}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Section</p><p className="mt-2 font-bold text-[#10233f]">{profile.section.name}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Status</p><p className="mt-2 font-bold text-[#10233f]">{profile.user.status}</p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-2xl font-bold text-[#10233f]">Skills</h2>
          <div className="mt-5 space-y-3">
            {profile.skills.length ? profile.skills.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3"><span className="font-semibold text-[#10233f]">{entry.skill.name}</span><span className="text-xs text-slate-500">{states[entry.skillId]}</span></div>
              </div>
            )) : <p className="text-sm text-slate-500">No skills started yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-2xl font-bold text-[#10233f]">Certificates</h2>
          <div className="mt-5 space-y-3">
            {profile.certificates.length ? profile.certificates.map((certificate) => (
              <div key={certificate.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-[#10233f]">{certificate.skill.name}</p>
                <p className="text-sm text-slate-500">Status: {certificate.status}</p><p>Credential: {certificate.credentialId} · {certificate.officialUrl}</p><p>Issued: {certificate.issuedAt?.toLocaleDateString()} · Verified: {certificate.verifiedAt?.toLocaleString()} · By: {certificate.verifiedBy?.email}</p><h3 className="mt-3 font-bold">Verification history</h3>{certificate.reviews.map(r => <p key={r.id}>{r.createdAt.toLocaleString()} · {r.status} · {r.actor.email} · {r.remarks}</p>)}
              </div>
            )) : <p className="text-sm text-slate-500">No certificates.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-[#10233f]">Assessment attempts</h2>
        <div className="mt-5 space-y-3">
          {profile.attempts.length ? profile.attempts.map((attempt) => (
            <div key={attempt.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[#10233f]">{attempt.skill.name} · Attempt #{attempt.attemptNumber}{attempt.attemptNumber > 1 ? " · Re-exam" : ""}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${attempt.passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {attempt.passed === null ? "In progress" : attempt.passed ? "Pass" : "Fail"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Score: {attempt.score ?? "Pending"}/{attempt.questionCount} · Violations: {attempt.violations.length} · Started: {new Date(attempt.startedAt).toLocaleString()}</p><p>Submitted: {attempt.submittedAt?.toLocaleString() ?? "Active"} · Auto-submit: {attempt.autoSubmitted ? "Yes" : "No"} · {attempt.submissionReason}</p>{attempt.reexamAvailableAt && <p>Re-exam available: {attempt.reexamAvailableAt.toLocaleString()}</p>}{attempt.violations.map(v => <p key={v.id}>{v.type} · {v.occurredAt.toISOString()}</p>)}
            </div>
          )) : <p className="text-sm text-slate-500">No attempts yet.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-[#10233f]">Activity timeline</h2>
        <div className="mt-5 space-y-3">
          {profile.activities.length ? profile.activities.map((activity) => (
            <div key={activity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-[#10233f]">{activity.action}</p>
              <p>{new Date(activity.createdAt).toLocaleString()}</p><p className="break-all">{JSON.stringify(activity.metadata)}</p>
            </div>
          )) : <p className="text-sm text-slate-500">No activity yet.</p>}
        </div>
      </div>
    </main>
  );
}
