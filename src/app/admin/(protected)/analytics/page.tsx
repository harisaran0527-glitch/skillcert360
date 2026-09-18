import { productionStudentWhere, productionSkillWhere, productionCourseWhere } from "@/lib/production-ui";
import { getCanonicalCourseIds } from "@/lib/catalogue-visibility";
import { db } from "@/lib/db";
import { BarChart3, Users, BookOpen, GraduationCap, Award, FileCheck2, ShieldCheck, Clock, XCircle, RefreshCw } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const courseIds = await getCanonicalCourseIds();
  const [
    students,
    activeStudents,
    skillCount,
    courseCount,
    certificatesVerified,
    certificatesPending,
    certificatesRejected,
    certificatesResubmission,
  ] = await Promise.all([
    db.studentProfile.count({ where: productionStudentWhere }),
    db.user.count({ where: { role: "STUDENT", status: "ACTIVE", studentProfile: productionStudentWhere } }),
    db.skill.count({ where: productionSkillWhere }),
    db.course.count({ where: { ...productionCourseWhere, id: { in: courseIds } } }),
    db.certificate.count({ where: { student: productionStudentWhere, skill: productionSkillWhere, status: "VERIFIED" } }),
    db.certificate.count({ where: { student: productionStudentWhere, skill: productionSkillWhere, status: "PENDING_VERIFICATION" } }),
    db.certificate.count({ where: { student: productionStudentWhere, skill: productionSkillWhere, status: "REJECTED" } }),
    db.certificate.count({ where: { student: productionStudentWhere, skill: productionSkillWhere, status: "NEEDS_RESUBMISSION" } }),
  ]);

  const totalCertificates = certificatesVerified + certificatesPending + certificatesRejected + certificatesResubmission;
  const verificationRate = totalCertificates > 0 ? Math.round((certificatesVerified / totalCertificates) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Platform Intelligence &amp; Real Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Command Analytics Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real database metrics across student participation, SkillLocker uploads, and credential verification throughput.
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

        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Certificate Uploads</span>
          <p className="mt-2 text-3xl font-extrabold text-white font-mono">{totalCertificates}</p>
          <span className="text-[11px] text-amber-300 font-bold mt-1 block">Pending Review: {certificatesPending}</span>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Verified Credentials</span>
          <p className="mt-2 text-3xl font-extrabold text-white font-mono">{certificatesVerified}</p>
          <span className="text-[11px] text-emerald-400 font-bold mt-1 block">Verification Rate: {verificationRate}%</span>
        </div>
      </div>

      {/* Real Breakdown Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white font-display border-b border-slate-800 pb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-400" />
            <span>SkillLocker Status Breakdown</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending Verification:</span>
              <span className="font-bold text-amber-400 font-mono">{certificatesPending}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Verified Credentials:</span>
              <span className="font-bold text-emerald-400 font-mono">{certificatesVerified}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-rose-400 font-semibold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Rejected Submissions:</span>
              <span className="font-bold text-rose-400 font-mono">{certificatesRejected}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-amber-300 font-semibold flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Resubmission Required:</span>
              <span className="font-bold text-amber-300 font-mono">{certificatesResubmission}</span>
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
              <span className="text-slate-400">Total Uploaded Certificates:</span>
              <span className="font-bold text-white font-mono">{totalCertificates}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-emerald-400 font-semibold">Verified Credentials:</span>
              <span className="font-bold text-emerald-400 font-mono">{certificatesVerified}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-amber-300 font-semibold">Verification Rate:</span>
              <span className="font-bold text-amber-300 font-mono">{verificationRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
