import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { expireStudentAttempts } from "@/lib/assessment";
import {
  Award,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default async function StudentAssessmentsListPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const profile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!profile) redirect("/student/login");

  await expireStudentAttempts(profile.id);

  const attempts = await db.assessmentAttempt.findMany({
    where: { studentId: profile.id },
    include: {
      skill: {
        include: {
          category: true,
          level: true,
        },
      },
      violations: true,
    },
    orderBy: { startedAt: "desc" },
  });

  const activeAttempts = attempts.filter((a) => !a.submittedAt && a.expiresAt > new Date());
  const completedAttempts = attempts.filter((a) => a.submittedAt || a.expiresAt <= new Date());

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Secure Assessment Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white font-display">Assessments History & Status</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review secure evaluation attempts, scores, violation logs, and re-exam availability.
        </p>
      </div>

      {/* Active Assessment Alert */}
      {activeAttempts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-amber-400 font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Active Assessment In Progress ({activeAttempts.length})</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-6 flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                      Attempt #{attempt.attemptNumber}
                    </span>
                    <span className="text-xs font-mono text-amber-300 font-semibold animate-pulse">
                      In Progress
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-white font-display">{attempt.skill.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {attempt.skill.category.name} · {attempt.skill.level.name} Tier
                  </p>
                </div>

                <div className="pt-4 border-t border-amber-500/30 flex items-center justify-between">
                  <span className="text-xs text-amber-200">
                    Violations: <strong className="text-white font-mono">{attempt.violations.length} / {attempt.violationLimit}</strong>
                  </span>
                  <Link
                    href={`/student/assessment/${attempt.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 transition-all"
                  >
                    <span>Resume Secure Exam</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed Assessments Table */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Award className="h-5 w-5 text-cyan-400" />
          <span>Completed Evaluation History ({completedAttempts.length})</span>
        </h2>

        {completedAttempts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400 space-y-2">
            <Award className="h-8 w-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-white">No completed assessment history yet.</p>
            <p>Complete learning on any unlocked skill to attempt an official assessment.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Skill Name</th>
                    <th className="px-5 py-3.5">Tier & Category</th>
                    <th className="px-5 py-3.5">Attempt</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Result</th>
                    <th className="px-5 py-3.5">Violations</th>
                    <th className="px-5 py-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {completedAttempts.map((attempt) => {
                    const isPassed = attempt.passed === true;
                    return (
                      <tr key={attempt.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-white font-display">{attempt.skill.name}</td>
                        <td className="px-5 py-4 text-slate-400">
                          {attempt.skill.level.name} · {attempt.skill.category.name}
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-300">#{attempt.attemptNumber}</td>
                        <td className="px-5 py-4 font-bold text-white font-mono">
                          {attempt.score !== null
                            ? `${attempt.score} / ${attempt.questionCount} (${Math.round((attempt.score / attempt.questionCount) * 100)}%)`
                            : "N/A"}
                        </td>
                        <td className="px-5 py-4">
                          {isPassed ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" /> PASSED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                              <XCircle className="h-3 w-3" /> FAILED
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-400">
                          {attempt.violations.length} / {attempt.violationLimit}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/student/results/${attempt.id}`}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold"
                          >
                            View Result
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
