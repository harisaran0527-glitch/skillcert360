import { expireStudentAttempts, isCorrect } from "@/lib/assessment";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

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
    },
  });

  if (!attempt || attempt.student.userId !== session.userId) redirect("/student/dashboard");

  if (!attempt.submittedAt) redirect(`/student/assessment/${id}`);
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const answer of attempt.answers) {
    const userAnswer = answer.answer as unknown;
    const correctAnswer = (answer.correctAnswerSnapshot ?? answer.question.correctAnswer) as unknown;
    if (userAnswer === undefined || userAnswer === null || (typeof userAnswer === "string" && userAnswer.trim() === "") || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
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

  return (
    <main className="min-h-screen bg-[#f5f8fc] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Assessment Result</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">{pass ? "Pass" : "Try again"}</h1>
          </div>
          <Link href="/student/dashboard" className="text-sm font-semibold text-[#1e6fd9]">← Dashboard</Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Score</p><p className="mt-2 text-3xl font-bold text-[#10233f]">{attempt.score ?? correct}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Correct</p><p className="mt-2 text-3xl font-bold text-[#10233f]">{correct}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Wrong</p><p className="mt-2 text-3xl font-bold text-[#10233f]">{wrong}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Unanswered</p><p className="mt-2 text-3xl font-bold text-[#10233f]">{unanswered}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Percentage</p><p className="mt-2 text-3xl font-bold text-[#10233f]">{percentage}%</p></div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          <p><span className="font-semibold text-[#10233f]">Attempt status:</span> {pass ? "Passed" : "Failed"}</p>
          <p className="mt-2"><span className="font-semibold text-[#10233f]">Violations:</span> {attempt.violations.length}</p>
          <p className="mt-2"><span className="font-semibold text-[#10233f]">Submitted:</span> {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "Not available"}</p>
        </div>

        <p className="mt-5">Pass mark: {attempt.passMark}/{attempt.questionCount} · Submission: {attempt.submissionReason ?? "Recorded"}</p>{attempt.reexamAvailableAt && <p>Re-exam available: {attempt.reexamAvailableAt.toLocaleString()}</p>}<div className="mt-8 flex flex-wrap gap-3">
          <Link href="/student/skills" className="rounded-lg bg-[#1e6fd9] px-4 py-2 font-semibold text-white">Return to skills</Link>
          {pass ? <Link href="/student/certificates" className="rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-2 font-semibold text-emerald-700">Certificate portal</Link> : <Link href="/student/skills" className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700">Re-attempt</Link>}
        </div>
      </div>
    </main>
  );
}
