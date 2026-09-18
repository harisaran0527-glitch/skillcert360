import { productionStudentWhere, productionSkillWhere, productionCourseWhere } from "@/lib/production-ui";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  Users,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Award,
  FileCheck2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowRight,
  Command,
} from "lucide-react";

export default async function AdminDashboard() {
  const [
    totalStudents,
    activeStudents,
    totalSkills,
    totalCourses,
    certificatesPending,
    certificatesVerified,
    certificatesRejected,
    certificatesResubmission,
  ] = await Promise.all([
    db.studentProfile.count({ where: productionStudentWhere }),
    db.user.count({ where: { role: "STUDENT", status: "ACTIVE", studentProfile: productionStudentWhere } }),
    db.skill.count({ where: productionSkillWhere }),
    db.course.count({ where: productionCourseWhere }),
    db.certificate.count({ where: { student: productionStudentWhere, skill: productionSkillWhere, status: "PENDING_VERIFICATION" } }),
    db.certificate.count({ where: { student: productionStudentWhere, skill: productionSkillWhere, status: "VERIFIED" } }),
    db.certificate.count({ where: { student: productionStudentWhere, skill: productionSkillWhere, status: "REJECTED" } }),
    db.certificate.count({ where: { student: productionStudentWhere, skill: productionSkillWhere, status: "NEEDS_RESUBMISSION" } }),
  ]);

  const totalUploaded = certificatesPending + certificatesVerified + certificatesRejected + certificatesResubmission;
  const verificationRate = totalUploaded > 0 ? Math.round((certificatesVerified / totalUploaded) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-8 border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
              <Command className="h-3.5 w-3.5" />
              <span>SkillCert HQ — Command & Control</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">Administrator Command Center</h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Real-time platform metrics, student progression standings, and SkillLocker certificate verification queues.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/certificates"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-500 transition-all"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Verification Queue ({certificatesPending})</span>
            </Link>
            <Link
              href="/admin/students"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all"
            >
              <Users className="h-4 w-4" />
              <span>Student Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Students</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white font-mono">{totalStudents}</p>
        </div>

        {/* Active Accounts */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Accounts</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white font-mono">{activeStudents}</p>
        </div>

        {/* Total Skills */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Skills</span>
            <BookOpen className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white font-mono">{totalSkills}</p>
        </div>

        {/* Courses */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Curated Courses</span>
            <GraduationCap className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white font-mono">{totalCourses}</p>
        </div>
      </section>

      {/* SkillLocker & Certificate Verification Metrics Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Verification Queue Breakdown */}
        <div className="glass-panel rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <span>SkillLocker Verification Queue</span>
            </h2>
            <Link href="/admin/certificates" className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1">
              Review Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Pending</span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono mt-1 block">{certificatesPending}</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Rejected</span>
              <span className="text-2xl font-extrabold text-rose-400 font-mono mt-1 block">{certificatesRejected}</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">Resubmit</span>
              <span className="text-2xl font-extrabold text-amber-300 font-mono mt-1 block">{certificatesResubmission}</span>
            </div>
          </div>
        </div>

        {/* Certificate Credential Standing */}
        <div className="glass-panel rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-emerald-400" />
              <span>Certificate Credential Standing</span>
            </h2>
            <Link href="/admin/certificates" className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1">
              Review Queue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">Total Uploads</span>
              <span className="text-3xl font-extrabold text-white font-mono mt-1 block">{totalUploaded}</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Verified ✓</span>
              <span className="text-3xl font-extrabold text-emerald-400 font-mono mt-1 block">{certificatesVerified}</span>
            </div>
          </div>

          {/* Real Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-400">Verification Rate:</span>
              <span className="font-bold text-emerald-400 font-mono">{verificationRate}%</span>
            </div>
            <div className="h-3.5 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${verificationRate}%` }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
