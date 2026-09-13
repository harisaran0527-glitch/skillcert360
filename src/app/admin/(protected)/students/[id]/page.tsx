import { expireStudentAttempts } from "@/lib/assessment";
import { getSkillProgressState } from "@/lib/progress";
import { getStudentProgression, UNLOCK_THRESHOLDS, GATING_LEVEL } from "@/lib/progression";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  User,
  ShieldCheck,
  Award,
  BookOpen,
  FileCheck2,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Activity,
  Layers,
  Sparkles,
  Command,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default async function AdminStudent360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await expireStudentAttempts(id);

  const profile = await db.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      department: true,
      section: true,
      skills: {
        include: {
          skill: true,
          courseProgress: { include: { course: { include: { provider: true } } } },
        },
      },
      attempts: {
        include: {
          skill: true,
          violations: { orderBy: { occurredAt: "asc" } },
        },
        orderBy: { startedAt: "desc" },
      },
      certificates: {
        include: {
          skill: true,
          verifiedBy: { select: { email: true } },
          reviews: {
            include: { actor: { select: { email: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) notFound();

  const [states, progression] = await Promise.all([
    Promise.all(
      profile.skills.map(async (entry) => [entry.skillId, await getSkillProgressState(id, entry.skillId)] as [string, string])
    ).then(Object.fromEntries),
    getStudentProgression(id),
  ]);

  const currentHighestLevel = progression.levels.filter((l) => l.unlocked).pop()?.name || "Beginner";

  return (
    <div className="space-y-8 pb-12">
      {/* Back Link */}
      <div>
        <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
          <ArrowLeft className="h-4 w-4" /> Back to Student Directory
        </Link>
      </div>

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border-indigo-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 text-2xl font-extrabold text-white font-display shadow-lg shadow-indigo-500/20">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-0.5 text-xs font-bold text-indigo-300 mb-1">
                <Command className="h-3.5 w-3.5" />
                <span>Student 360 Command View</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white font-display">{profile.fullName}</h1>
              <p className="text-xs text-slate-400 font-mono">
                Reg No: <strong className="text-cyan-400">{profile.registerNumber}</strong> · Email: <strong className="text-slate-200">{profile.user.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Progression Standing</span>
              <span className="text-indigo-300 font-extrabold font-display">{currentHighestLevel} Tier</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Status</span>
              <span className="text-emerald-400 font-bold">{profile.user.status}</span>
            </div>
          </div>
        </div>

        {/* Metadata Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Department</span>
            <span className="font-semibold text-white mt-0.5 block">{profile.department.name}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Academic Class</span>
            <span className="font-semibold text-white mt-0.5 block">Year {profile.year} · Sec {profile.section.name}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Account Created</span>
            <span className="font-semibold text-slate-300 mt-0.5 block">{profile.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Last Login</span>
            <span className="font-semibold text-slate-300 mt-0.5 block">{profile.user.lastLoginAt ? profile.user.lastLoginAt.toLocaleDateString() : "Never"}</span>
          </div>
        </div>
      </div>

      {/* 4-Level Progression Status Section */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <span>4-Level Progression Standing</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {progression.levels.map((level) => {
            const gating = GATING_LEVEL[level.name];
            const threshold = UNLOCK_THRESHOLDS[level.name];
            const gatingCount = gating ? (progression.levels.find((l) => l.name === gating)?.verifiedCount ?? 0) : 0;

            return (
              <div
                key={level.name}
                className={`rounded-2xl border p-5 space-y-3 ${
                  level.unlocked
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-900/60 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{level.name}</span>
                  {level.unlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <Unlock className="h-3 w-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </div>

                <div className="pt-2 text-xs space-y-1">
                  {gating ? (
                    <p className="text-slate-300">
                      Requirement: <strong className="text-white">{gatingCount} / {threshold}</strong> {gating} certs
                    </p>
                  ) : (
                    <p className="text-emerald-400 font-medium">Baseline Tier — Always Unlocked</p>
                  )}
                  <p className="text-slate-400">Own Verified Certs: <strong className="text-cyan-300">{level.verifiedCount}</strong></p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Grid: Enrolled Skills & Certificates */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Enrolled Skills */}
        <section className="glass-panel rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2 border-b border-slate-800 pb-3">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span>Enrolled Skills & Learning Progress ({profile.skills.length})</span>
          </h2>
          <div className="space-y-3">
            {profile.skills.length === 0 ? (
              <p className="text-xs text-slate-500 p-4">No skills enrolled yet.</p>
            ) : (
              profile.skills.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-xs font-display">{entry.skill.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Enrolled: {entry.startedAt.toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300">
                    {states[entry.skillId]}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Certificates & Verification Queue */}
        <section className="glass-panel rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
            <span>Certificates & Credential Records ({profile.certificates.length})</span>
          </h2>
          <div className="space-y-3">
            {profile.certificates.length === 0 ? (
              <p className="text-xs text-slate-500 p-4">No certificates submitted.</p>
            ) : (
              profile.certificates.map((cert) => (
                <div key={cert.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-display">{cert.skill.name}</span>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">{cert.status}</span>
                  </div>
                  <p className="text-slate-400 font-mono text-[11px]">Credential ID: {cert.credentialId || "N/A"}</p>
                  {cert.remarks && <p className="text-amber-300 font-semibold">Remarks: {cert.remarks}</p>}
                  <details className="mt-3 border-t border-slate-700 pt-2">
                    <summary className="cursor-pointer text-cyan-300">Verification history</summary>
                    {cert.reviews.map(review => <p key={review.id} className="mt-2 text-slate-300">{review.status} · {review.actor.email} · {new Date(review.createdAt).toLocaleString()}{review.remarks ? ` · ${review.remarks}` : ""}</p>)}
                  </details>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Assessment Attempts & Security Violations Log */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 border-b border-slate-800 pb-4">
          <Award className="h-5 w-5 text-indigo-400" />
          <span>Assessment Attempts & Security Log ({profile.attempts.length})</span>
        </h2>

        <div className="space-y-4">
          {profile.attempts.length === 0 ? (
            <p className="text-xs text-slate-500 p-6 text-center">No assessment attempts logged for this student.</p>
          ) : (
            profile.attempts.map((attempt) => (
              <div key={attempt.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white font-display text-sm">{attempt.skill.name}</span>
                    <span className="text-slate-400 ml-2 font-mono">Attempt #{attempt.attemptNumber}</span>
                  </div>

                  <div>
                    {attempt.passed === true ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 text-[10px] font-bold text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> PASSED
                      </span>
                    ) : attempt.passed === false ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-0.5 text-[10px] font-bold text-rose-300">
                        <XCircle className="h-3 w-3" /> FAILED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-0.5 text-[10px] font-bold text-amber-300">
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <div>Score: <strong className="text-white font-mono">{attempt.score ?? "N/A"} / {attempt.questionCount}</strong></div>
                  <div>Violations: <strong className="text-amber-400 font-mono">{attempt.violations.length}</strong></div>
                  <div>Auto-Submitted: <strong className="text-slate-200">{attempt.autoSubmitted ? "Yes" : "No"}</strong></div>
                  <div>Started: <strong className="text-slate-200">{new Date(attempt.startedAt).toLocaleString()}</strong></div>
                </div>

                {attempt.violations.length > 0 && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1">
                    <span className="font-bold text-rose-300 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Security Violations Recorded ({attempt.violations.length}):
                    </span>
                    {attempt.violations.map((v) => (
                      <p key={v.id} className="text-[11px] text-rose-200/90 font-mono">
                        • {v.type} at {new Date(v.occurredAt).toLocaleTimeString()}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Activity Timeline */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 border-b border-slate-800 pb-4">
          <Activity className="h-5 w-5 text-cyan-400" />
          <span>Activity Audit Log ({profile.activities.length})</span>
        </h2>

        <div className="space-y-3">
          {profile.activities.length === 0 ? (
            <p className="text-xs text-slate-500 p-4">No audit events logged.</p>
          ) : (
            profile.activities.map((act) => (
              <div key={act.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-white font-mono">{act.action}</span>
                  <span className="text-[11px] text-slate-400 block truncate">{JSON.stringify(act.metadata)}</span>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
