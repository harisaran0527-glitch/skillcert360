import { displaySection } from "@/lib/ui-options";
import { SectionSelect } from "@/components/section-select";
import { expireStudentAttempts } from "@/lib/assessment";
import { getSkillProgressState } from "@/lib/progress";
import { getStudentProgression, UNLOCK_THRESHOLDS, GATING_LEVEL } from "@/lib/progression";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCleanDepartments } from "@/lib/academic";
import { PasswordField } from "@/components/password-field";
import { DeleteStudentModal } from "@/components/delete-student-modal";
import {
  ShieldCheck,
  Award,
  BookOpen,
  FileCheck2,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowLeft,
  Activity,
  Command,
  CheckCircle2,
  XCircle,
  Pencil,
  KeyRound,
  ShieldOff,
  AlertCircle,
  Save,
  RefreshCw,
  Trash2,
} from "lucide-react";

export default async function AdminStudent360Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string; pwdReset?: string; statusChanged?: string; deleted?: string }>;
}) {
  const { id } = await params;
  const { error, updated, pwdReset, statusChanged } = await searchParams;
  await expireStudentAttempts(id);

  const cleanDepts = await getCleanDepartments();

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

  const allDepartments = cleanDepts;

  const [states, progression] = await Promise.all([
    Promise.all(
      profile.skills.map(
        async (entry) =>
          [entry.skillId, await getSkillProgressState(id, entry.skillId)] as [string, string],
      ),
    ).then(Object.fromEntries),
    getStudentProgression(id),
  ]);

  const currentHighestLevel =
    progression.levels.filter((l) => l.unlocked).pop()?.name || "Beginner";
  const isActive = profile.user.status === "ACTIVE";

  return (
    <div className="space-y-8 pb-12">
      {/* Back */}
      <div>
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Student Directory
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-center gap-2.5 text-xs font-semibold text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {updated && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300">
          ✓ Student profile updated successfully.
        </div>
      )}
      {pwdReset && (
        <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-4 text-xs font-semibold text-cyan-300">
          ✓ Password reset. Student must set a new password on next login.
        </div>
      )}
      {statusChanged && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs font-semibold text-amber-300">
          ✓ Account status updated.
        </div>
      )}

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
              <h1 className="text-3xl font-extrabold text-white font-display">
                {profile.fullName}
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Reg No: <strong className="text-cyan-400">{profile.registerNumber}</strong> · Email:{" "}
                <strong className="text-slate-200">{profile.user.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Progression</span>
              <span className="text-indigo-300 font-extrabold font-display">{currentHighestLevel} Tier</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Status</span>
              <span className={`font-bold ${isActive ? "text-emerald-400" : "text-rose-400"}`}>
                {profile.user.status}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Department</span>
            <span className="font-semibold text-white mt-0.5 block">{profile.department.name}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Class</span>
            <span className="font-semibold text-white mt-0.5 block">
              Year {profile.year} · Sec {displaySection(profile.section.name)}
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Account Created</span>
            <span className="font-semibold text-slate-300 mt-0.5 block">
              {profile.createdAt.toLocaleDateString()}
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Last Login</span>
            <span className="font-semibold text-slate-300 mt-0.5 block">
              {profile.user.lastLoginAt
                ? profile.user.lastLoginAt.toLocaleDateString()
                : "Never"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Admin Actions ─────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {/* Edit Student */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Pencil className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display">Edit Student</h2>
              <p className="text-[11px] text-slate-400">Update profile information.</p>
            </div>
          </div>
          <form action={`/api/admin/students/${id}`} method="post" className="space-y-3 text-xs">
            {/* Use PATCH via hidden field workaround — Next.js only supports GET/POST in HTML forms; we use POST + X-HTTP-Method-Override */}
            {/* We'll use a separate PATCH endpoint via fetch in the student list; for HTML forms we route through the POST handler */}
            {/* Actually we POST to /api/admin/students/[id] with _action=edit */}
            <input type="hidden" name="_action" value="edit" />

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Full Name</label>
              <input
                name="fullName"
                defaultValue={profile.fullName}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Register Number</label>
              <input
                name="registerNumber"
                defaultValue={profile.registerNumber}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={profile.user.email}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Department</label>
                <select
                  name="departmentId"
                  defaultValue={profile.departmentId}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-2 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {allDepartments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Section</label>
                <SectionSelect value={displaySection(profile.section.name)} className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Academic Year</label>
              <input
                name="year"
                type="number"
                min="1"
                max="8"
                defaultValue={profile.year}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 text-xs font-bold text-white shadow-lg hover:from-blue-500 hover:to-blue-400 transition-all cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" /> Save Changes
            </button>
          </form>
        </div>

        {/* Reset Password */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <KeyRound className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display">Reset Password</h2>
              <p className="text-[11px] text-slate-400">
                Student must change on next login.
              </p>
            </div>
          </div>
          <form
            action={`/api/admin/students/${id}`}
            method="post"
            className="space-y-3 text-xs"
          >
            <input type="hidden" name="_action" value="reset-password" />
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">New Password</label>
              <PasswordField name="newPassword" variant="dark" placeholder="Min 8 characters" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Confirm Password</label>
              <PasswordField name="confirmPassword" variant="dark" placeholder="Repeat password" />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-2.5 text-xs font-bold text-white shadow-lg hover:from-amber-500 hover:to-amber-400 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset Password
            </button>
          </form>
        </div>

        {/* Disable / Enable Account */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                isActive
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {isActive ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display">
                {isActive ? "Disable Account" : "Enable Account"}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isActive
                  ? "Block student login immediately."
                  : "Restore student access."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2">
            <p className="text-slate-300">
              Current status:{" "}
              <strong className={isActive ? "text-emerald-400" : "text-rose-400"}>
                {profile.user.status}
              </strong>
            </p>
            {isActive ? (
              <p className="text-slate-400">
                Disabling will immediately revoke login access. Existing sessions will be invalidated on next request.
              </p>
            ) : (
              <p className="text-slate-400">
                Enabling will restore login access for this student.
              </p>
            )}
          </div>

          <form action={`/api/admin/students/${id}`} method="post">
            <input type="hidden" name="_action" value="set-status" />
            <input
              type="hidden"
              name="status"
              value={isActive ? "DISABLED" : "ACTIVE"}
            />
            <button
              type="submit"
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
              }`}
            >
              {isActive ? (
                <>
                  <ShieldOff className="h-3.5 w-3.5" /> Disable Account
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" /> Enable Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Delete Student */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 border border-rose-500/20">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Trash2 className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display">Delete Student</h2>
              <p className="text-[11px] text-rose-400 font-semibold">Permanent — cannot be undone.</p>
            </div>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs text-rose-200/80 leading-relaxed">
            Permanently removes the student account, all skills, assessments, certificates, and activity logs. Certificate files are purged from storage.
          </div>
          <DeleteStudentModal
            studentId={id}
            studentName={profile.fullName}
            registerNumber={profile.registerNumber}
          />
        </div>
      </div>

      {/* ── 4-Level Progression ───────────────────────────────── */}
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
            const gatingCount = gating
              ? (progression.levels.find((l) => l.name === gating)?.verifiedCount ?? 0)
              : 0;

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
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {level.name}
                  </span>
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
                      Requirement:{" "}
                      <strong className="text-white">
                        {gatingCount} / {threshold}
                      </strong>{" "}
                      {gating} certs
                    </p>
                  ) : (
                    <p className="text-emerald-400 font-medium">
                      Baseline Tier — Always Unlocked
                    </p>
                  )}
                  <p className="text-slate-400">
                    Own Verified Certs:{" "}
                    <strong className="text-cyan-300">{level.verifiedCount}</strong>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Enrolled Skills & Certificates ───────────────────── */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="glass-panel rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2 border-b border-slate-800 pb-3">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span>Enrolled Skills ({profile.skills.length})</span>
          </h2>
          <div className="space-y-3">
            {profile.skills.length === 0 ? (
              <p className="text-xs text-slate-500 p-4">No skills enrolled yet.</p>
            ) : (
              profile.skills.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-white text-xs font-display">
                      {entry.skill.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Enrolled: {entry.startedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300">
                    {states[entry.skillId]}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
            <span>Certificates ({profile.certificates.length})</span>
          </h2>
          <div className="space-y-3">
            {profile.certificates.length === 0 ? (
              <p className="text-xs text-slate-500 p-4">No certificates submitted.</p>
            ) : (
              profile.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-display">{cert.skill.name}</span>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                      {cert.status}
                    </span>
                  </div>
                  <p className="text-slate-400 font-mono text-[11px]">
                    Credential ID: {cert.credentialId || "N/A"}
                  </p>
                  {cert.remarks && (
                    <p className="text-amber-300 font-semibold">Remarks: {cert.remarks}</p>
                  )}
                  <details className="mt-3 border-t border-slate-700 pt-2">
                    <summary className="cursor-pointer text-cyan-300">Verification history</summary>
                    {cert.reviews.map((review) => (
                      <p key={review.id} className="mt-2 text-slate-300">
                        {review.status} · {review.actor.email} ·{" "}
                        {new Date(review.createdAt).toLocaleString()}
                        {review.remarks ? ` · ${review.remarks}` : ""}
                      </p>
                    ))}
                  </details>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Assessment Attempts ───────────────────────────────── */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2 border-b border-slate-800 pb-4">
          <Award className="h-5 w-5 text-indigo-400" />
          <span>Assessment Attempts & Security Log ({profile.attempts.length})</span>
        </h2>

        <div className="space-y-4">
          {profile.attempts.length === 0 ? (
            <p className="text-xs text-slate-500 p-6 text-center">
              No assessment attempts logged for this student.
            </p>
          ) : (
            profile.attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white font-display text-sm">
                      {attempt.skill.name}
                    </span>
                    <span className="text-slate-400 ml-2 font-mono">
                      Attempt #{attempt.attemptNumber}
                    </span>
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
                  <div>
                    Score:{" "}
                    <strong className="text-white font-mono">
                      {attempt.score ?? "N/A"} / {attempt.questionCount}
                    </strong>
                  </div>
                  <div>
                    Violations:{" "}
                    <strong className="text-amber-400 font-mono">
                      {attempt.violations.length}
                    </strong>
                  </div>
                  <div>
                    Auto-Submitted:{" "}
                    <strong className="text-slate-200">
                      {attempt.autoSubmitted ? "Yes" : "No"}
                    </strong>
                  </div>
                  <div>
                    Started:{" "}
                    <strong className="text-slate-200">
                      {new Date(attempt.startedAt).toLocaleString()}
                    </strong>
                  </div>
                </div>

                {attempt.violations.length > 0 && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1">
                    <span className="font-bold text-rose-300 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Security Violations (
                      {attempt.violations.length}):
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

      {/* ── Activity Log ─────────────────────────────────────── */}
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
              <div
                key={act.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs flex items-center justify-between gap-4"
              >
                <div>
                  <span className="font-bold text-white font-mono">{act.action}</span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {JSON.stringify(act.metadata)}
                  </span>
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
