import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { expireStudentAttempts } from "@/lib/assessment";
import { getSkillProgressState } from "@/lib/progress";
import { getStudentProgression, UNLOCK_THRESHOLDS, GATING_LEVEL } from "@/lib/progression";
import {
  BookOpen,
  Award,
  FileCheck2,
  RotateCcw,
  Unlock,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default async function StudentDashboard() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");
  
  const profile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
    include: { department: true, section: true },
  });
  if (!profile) redirect("/student/login");

  await expireStudentAttempts(profile.id);

  const [skills, attempts, certificates, progression] = await Promise.all([
    db.studentSkill.findMany({ where: { studentId: profile.id }, include: { skill: { include: { level: true } } } }),
    db.assessmentAttempt.findMany({ where: { studentId: profile.id }, orderBy: { startedAt: "desc" } }),
    db.certificate.findMany({ where: { studentId: profile.id } }),
    getStudentProgression(profile.id),
  ]);

  const latestMap = new Map<string, typeof attempts[number]>();
  for (const attempt of attempts) {
    if (!latestMap.has(attempt.skillId)) latestMap.set(attempt.skillId, attempt);
  }

  // Exact real metrics
  const skillsStarted = skills.length;
  const assessmentsPassed = attempts.filter((a) => a.passed === true).length;
  const certificatesVerified = certificates.filter((c) => c.status === "VERIFIED").length;
  const reexamsPending = [...latestMap.values()].filter((a) => a.passed === false).length;

  const currentHighestLevel = progression.levels.filter((l) => l.unlocked).pop()?.name || "Beginner";

  return (
    <div className="space-y-10 pb-12">
      {/* Top Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-r from-[#0d172a] via-[#0f1e38] to-[#0d172a] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Current Status: <strong className="text-white">{currentHighestLevel} Level</strong></span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              Welcome back, <span className="text-gradient-cyan">{profile.fullName}</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Track your skill development, complete verified assessments, and earn official credentials across 4 progression tiers.
            </p>

            {/* Student Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-3 text-xs">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 font-mono text-cyan-300">
                <span className="text-slate-500">Reg No:</span>
                <span className="font-bold">{profile.registerNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-slate-300">
                <span className="text-slate-500">Dept:</span>
                <span className="font-semibold text-white">{profile.department.name}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-slate-300">
                <span className="text-slate-500">Year:</span>
                <span className="font-semibold text-white">Year {profile.year}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-slate-300">
                <span className="text-slate-500">Sec:</span>
                <span className="font-semibold text-white">Section {profile.section.name}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/student/skills"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all duration-200"
            >
              <span>Explore Skills</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Summary KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Skills Started */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Skills Started</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-white font-display">{skillsStarted}</p>
            <Link href="/student/my-learning" className="text-xs font-medium text-blue-400 hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Assessments Passed */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assessments Passed</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-white font-display">{assessmentsPassed}</p>
            <Link href="/student/assessment" className="text-xs font-medium text-emerald-400 hover:underline flex items-center gap-0.5">
              History <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Certificates Verified */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Certificates Verified</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-white font-display">{certificatesVerified}</p>
            <Link href="/student/certificates" className="text-xs font-medium text-cyan-400 hover:underline flex items-center gap-0.5">
              Certificates <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Re-exams Pending */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Re-exams Pending</p>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${reexamsPending > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-slate-800/60 text-slate-400 border-slate-700/50"}`}>
              <RotateCcw className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-white font-display">{reexamsPending}</p>
            <Link href="/student/assessment" className="text-xs font-medium text-amber-400 hover:underline flex items-center gap-0.5">
              Review <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4-Level Journey Timeline Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              <span>4-Level Skill Progression Journey</span>
            </h2>
            <p className="text-xs text-slate-400">
              Levels unlock strictly through admin-verified official certificates.
            </p>
          </div>
        </div>

        {/* Timeline Connected Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 relative">
          {progression.levels.map((level, idx) => {
            const gating = GATING_LEVEL[level.name];
            const threshold = UNLOCK_THRESHOLDS[level.name];
            const gatingCount = gating ? (progression.levels.find((l) => l.name === gating)?.verifiedCount ?? 0) : 0;
            const progressPercent = gating ? Math.min(100, Math.round((gatingCount / threshold) * 100)) : 100;

            return (
              <div
                key={level.name}
                className={`relative rounded-2xl border transition-all duration-300 p-6 flex flex-col justify-between ${
                  level.unlocked
                    ? "border-cyan-500/40 bg-gradient-to-b from-[#0e1d38] to-[#0a1326] shadow-xl shadow-cyan-500/10"
                    : "border-slate-800/80 bg-[#080d18] opacity-85 hover:border-slate-700/80"
                }`}
              >
                {/* Header Info */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Tier 0{idx + 1}
                    </span>
                    {level.unlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                        <Unlock className="h-3 w-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-2xl font-bold text-white font-display flex items-center gap-2">
                    {level.name}
                  </h3>

                  {/* Verification Status */}
                  <div className="mt-4 space-y-2">
                    {gating ? (
                      <>
                        <div className="flex justify-between text-xs text-slate-300">
                          <span className="font-medium">Requirement</span>
                          <span className="font-bold text-cyan-300">{gatingCount} / {threshold} {gating} Certs</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              level.unlocked
                                ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                                : "bg-gradient-to-r from-amber-500 to-orange-500"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {!level.unlocked ? (
                          <p className="text-[11px] text-amber-300/90 font-medium">
                            🔒 Verify {level.remaining} more {gating} certificates to unlock.
                          </p>
                        ) : (
                          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Requirement satisfied
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="py-2">
                        <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Always unlocked baseline tier
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Count */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Verified Certs:</span>
                  <span className="font-bold text-white text-sm font-mono">{level.verifiedCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Learning Skills List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan-400" />
            <span>Active Enrolled Skills</span>
          </h2>
          <Link href="/student/my-learning" className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1">
            View My Learning <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {skills.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 mx-auto">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-white">No active skills started yet.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Explore available skills matching your level and start learning officially.
            </p>
            <Link
              href="/student/skills"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-all"
            >
              <span>Explore Skills Catalogue</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {await Promise.all(
              skills.map(async (entry) => {
                const statusText = await getSkillProgressState(profile.id, entry.skillId);
                const latestAttempt = latestMap.get(entry.skillId);

                return (
                  <div key={entry.id} className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                          {entry.skill.level.name}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {statusText}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-bold text-white font-display hover:text-cyan-300 transition-colors">
                        <Link href={`/student/skills/${entry.skill.slug}`}>{entry.skill.name}</Link>
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      {latestAttempt?.submittedAt === null ? (
                        <Link
                          href={`/student/assessment/${latestAttempt.id}`}
                          className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>Resume Exam</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href={`/student/skills/${entry.skill.slug}`}
                          className="font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span>Skill Details</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    </div>
  );
}
