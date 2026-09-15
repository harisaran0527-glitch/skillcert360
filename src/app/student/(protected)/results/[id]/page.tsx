import { expireStudentAttempts, isCorrect } from "@/lib/assessment";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  FileCheck2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  Lock,
  Download,
} from "lucide-react";

export default async function StudentResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const { id } = await params;
  const owned = await db.assessmentAttempt.findFirst({ where: { id, student: { userId: session.userId } } });
  if (!owned) redirect("/student/dashboard");

  await expireStudentAttempts(owned.studentId);
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id },
    include: {
      answers: { include: { question: true } },
      student: true,
      violations: true,
      skill: {
        include: {
          level: true,
        },
      },
    },
  });

  if (!attempt || attempt.student.userId !== session.userId) redirect("/student/dashboard");
  if (!attempt.submittedAt) redirect(`/student/assessment/${id}`);

  const certificate = await db.certificate.findUnique({
    where: { studentId_skillId: { studentId: attempt.studentId, skillId: attempt.skillId } },
  });

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const answer of attempt.answers) {
    const userAnswer = answer.answer as unknown;
    const correctAnswer = (answer.correctAnswerSnapshot ?? answer.question.correctAnswer) as unknown;
    if (
      userAnswer === undefined ||
      userAnswer === null ||
      (typeof userAnswer === "string" && userAnswer.trim() === "") ||
      (Array.isArray(userAnswer) && userAnswer.length === 0)
    ) {
      unanswered += 1;
      continue;
    }
    if (isCorrect(userAnswer, correctAnswer)) {
      correct += 1;
    } else {
      wrong += 1;
    }
  }

  const percentage = attempt.answers.length ? Math.round((correct / attempt.answers.length) * 100) : 0;
  const pass = Boolean(attempt.passed);
  const certAvailable = pass && certificate && ["UNLOCKED", "VERIFIED"].includes(certificate.status);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Back Link */}
      <div>
        <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300">
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Main Result Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-8 border-cyan-500/30">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Assessment Outcome Report</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              {attempt.skill?.name || "Assessment Result"}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Attempt #{attempt.attemptNumber} · Submitted {new Date(attempt.submittedAt!).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {pass ? (
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-6 py-3 text-emerald-300 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400">Result</span>
                  <span className="text-xl font-extrabold font-display">PASS</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-6 py-3 text-rose-300 shadow-lg shadow-rose-500/10">
                <XCircle className="h-6 w-6 text-rose-400" />
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-rose-400">Result</span>
                  <span className="text-xl font-extrabold font-display">FAIL</span>
                </div>
              </div>
            )}
            
            {pass ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">
                <FileCheck2 className="h-3.5 w-3.5" /> Certificate Available / Issued
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-400">
                <Lock className="h-3.5 w-3.5" /> Certificate Locked
              </span>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Score</span>
            <span className="text-2xl font-extrabold text-white font-mono mt-1 block">
              {attempt.score ?? correct} / {attempt.questionCount}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Percentage</span>
            <span className="text-2xl font-extrabold text-cyan-400 font-mono mt-1 block">
              {percentage}%
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Correct</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">
              {correct}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Wrong</span>
            <span className="text-2xl font-extrabold text-rose-400 font-mono mt-1 block">
              {wrong}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Unanswered</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono mt-1 block">
              {unanswered}
            </span>
          </div>
        </div>

        {/* Attempt Metadata Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-xs text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Pass Mark Benchmark: <strong className="text-white font-mono">{attempt.passMark} / {attempt.questionCount}</strong></span>
            <span>Submission Reason: <strong className="text-cyan-300">{attempt.submissionReason ?? "Completed"}</strong></span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
            <span>Violations Logged: <strong className="text-amber-400 font-mono">{attempt.violations.length}</strong></span>
            {attempt.reexamAvailableAt && (
              <span className="text-amber-300 flex items-center gap-1 font-semibold">
                <Clock className="h-3.5 w-3.5" /> Re-exam Available: {attempt.reexamAvailableAt.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <p className={pass ? "text-sm text-emerald-300" : "text-sm text-amber-300"}>
          {pass ? "Assessment Passed. Visit the certificate portal to check availability and download." : "Assessment Failed → Certificate Locked. Retry after the cooldown shown above."}
        </p>
        {/* CTAs */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/student/skills"
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            Return to Skills Catalogue
          </Link>

          {pass ? (
            <div className="flex flex-wrap items-center gap-3">
              {certAvailable && (
                <>
                  <a
                    href={`/api/certificates/${certificate.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    <span>View Certificate</span>
                  </a>
                  <a
                    href={`/api/certificates/${certificate.id}/download?format=download`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Certificate</span>
                  </a>
                </>
              )}
              <Link
                href="/student/certificates"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
              >
                <FileCheck2 className="h-4 w-4" />
                <span>Student Certificates Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <Link
              href="/student/skills"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Prepare for Re-Exam</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
