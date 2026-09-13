import { db } from "@/lib/db";
import { BarChart3, Users, BookOpen, GraduationCap, Award, FileCheck2, ShieldCheck, Zap } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const [
    students,
    activeStudents,
    skillCount,
    courseCount,
    assessments,
    passed,
    failed,
    certificatesVerified,
    certificatesPending,
  ] = await Promise.all([
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

  const passRate = assessments > 0 ? Math.round((passed / assessments) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Platform Intelligence & Real Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Command Analytics Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real database metrics across student participation, evaluation outcomes, and credential throughput.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-l-4 border-l-indigo-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Students</span>
          <p className="mt-2 text-3xl font-extrabold text-white font-mono">{students}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Active Accounts: {activeStudents}</span>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-l-4 border-l-cyan-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Curriculum Depth</span>
          <p className="mt-2 text-3xl font-extrabold text-white font-mono">{skillCount} Skills</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Mapped Courses: {courseCount}</span>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assessment Evaluation</span>
          <p className="mt-2 text-3xl font-extrabold text-white font-mono">{assessments} Attempts</p>
          <span className="text-[11px] text-emerald-400 font-bold mt-1 block">Pass Rate: {passRate}%</span>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-l-4 border-l-purple-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Verified Certificates</span>
          <p className="mt-2 text-3xl font-extrabold text-white font-mono">{certificatesVerified}</p>
          <span className="text-[11px] text-amber-300 font-medium mt-1 block">Pending Review: {certificatesPending}</span>
        </div>
      </div>

      {/* Real Breakdown Charts / Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display border-b border-slate-800 pb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-400" />
            <span>Assessment Outcomes Breakdown</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-400">Total Evaluations Conducted:</span>
              <span className="font-bold text-white font-mono">{assessments}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-emerald-400 font-semibold">Passed Evaluations:</span>
              <span className="font-bold text-emerald-400 font-mono">{passed}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-rose-400 font-semibold">Failed Evaluations:</span>
              <span className="font-bold text-rose-400 font-mono">{failed}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display border-b border-slate-800 pb-3 flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-emerald-400" />
            <span>Credential Verification Throughput</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-emerald-400 font-semibold">Verified Credentials:</span>
              <span className="font-bold text-emerald-400 font-mono">{certificatesVerified}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-amber-300 font-semibold">Pending Review Queue:</span>
              <span className="font-bold text-amber-300 font-mono">{certificatesPending}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
