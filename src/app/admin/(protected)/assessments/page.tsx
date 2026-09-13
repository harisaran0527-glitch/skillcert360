import { productionStudentWhere, productionSkillWhere } from "@/lib/production-ui";
import { SectionSelect } from "@/components/section-select";
import { isValidSection } from "@/lib/ui-options";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { expireStudentAttempts } from "@/lib/assessment";
import { getCleanDepartments, ACADEMIC_YEARS, deduplicateByNormalizedKey } from "@/lib/academic";
import {
  Award,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default async function AssessmentAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");

  await expireStudentAttempts();

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value("date"))
    ? new Date(value("date") + "T00:00:00+05:30")
    : null;

  const student: Prisma.StudentProfileWhereInput = { ...productionStudentWhere };
  if (value("department")) student.departmentId = value("department");
  if (/^[1-4]$/.test(value("year"))) student.year = Number(value("year"));
  if (isValidSection(value("section"))) student.section = { name: value("section") };

  const where: Prisma.AssessmentAttemptWhereInput = { student, skill: productionSkillWhere };
  if (value("skill")) where.skillId = value("skill");
  if (["pass", "fail"].includes(value("result"))) where.passed = value("result") === "pass";
  if (date && Number.isFinite(date.getTime()))
    where.startedAt = { gte: date, lt: new Date(date.getTime() + 86400000) };

  const [attempts, departments, rawSkills] = await Promise.all([
    db.assessmentAttempt.findMany({
      where,
      include: {
        student: true,
        skill: true,
        violations: { orderBy: { occurredAt: "asc" } },
      },
      orderBy: { startedAt: "desc" },
    }),
    getCleanDepartments(),
    db.skill.findMany({ where: productionSkillWhere, orderBy: { name: "asc" } }),
  ]);

  const skills = deduplicateByNormalizedKey(rawSkills, (s) => s.name);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
            <Award className="h-3.5 w-3.5" />
            <span>Evaluation & Violation Audit Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Assessment Attempts Log</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time evaluation attempts, scores, proctored security violations, and auto-submission logs.
          </p>
        </div>
        <span className="text-xs font-mono text-indigo-400 font-bold bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          {attempts.length} Attempt Records
        </span>
      </div>

      {/* Filter Form */}
      <form method="get" className="glass-panel rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-400" />
            <span>Filter Assessments Log</span>
          </div>
          <Link href="/admin/assessments" className="text-xs text-indigo-400 hover:underline">
            Reset Filters
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select name="department" defaultValue={value("department")} className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none">
            <option value="">Department: All</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select name="year" defaultValue={value("year")} className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none">
            <option value="">Year: All</option>
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>

          <SectionSelect name="section" value={value("section")} filter className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200" />

          <select name="skill" defaultValue={value("skill")} className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none">
            <option value="">Skill: All</option>
            {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select name="result" defaultValue={value("result")} className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none">
            <option value="">Result: All</option>
            <option value="pass">Passed</option>
            <option value="fail">Failed</option>
          </select>

          <input
            type="date"
            name="date"
            defaultValue={value("date")}
            className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Attempts Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Skill</th>
                <th className="px-5 py-4">Attempt #</th>
                <th className="px-5 py-4">Score</th>
                <th className="px-5 py-4">Result</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Violations</th>
                <th className="px-5 py-4">Started</th>
                <th className="px-5 py-4">Submitted</th>
                <th className="px-5 py-4">Auto-Submit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {attempts.map((a) => {
                const durationSec = Math.max(
                  0,
                  Math.round(((a.submittedAt ?? new Date()).getTime() - a.startedAt.getTime()) / 1000)
                );

                return (
                  <tr key={a.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/admin/students/${a.studentId}`} className="font-bold text-indigo-400 hover:underline font-display block">
                        {a.student.fullName}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono">{a.student.registerNumber}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-white">{a.skill.name}</td>
                    <td className="px-5 py-4 font-mono text-slate-300">#{a.attemptNumber}</td>
                    <td className="px-5 py-4 font-bold text-white font-mono">
                      {a.score ?? "—"} / {a.questionCount}
                    </td>
                    <td className="px-5 py-4">
                      {a.passed === true ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> PASS
                        </span>
                      ) : a.passed === false ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                          <XCircle className="h-3 w-3" /> FAIL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                          IN PROGRESS
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">{durationSec} sec</td>
                    <td className="px-5 py-4">
                      {a.violations.length > 0 ? (
                        <span className="font-bold text-rose-400 font-mono flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> {a.violations.length} Logged
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">0</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">{a.startedAt.toLocaleTimeString()}</td>
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {a.submittedAt ? a.submittedAt.toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {a.autoSubmitted ? "Yes" : "No"} {a.terminated ? "· Terminated" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {attempts.length === 0 && (
            <div className="p-10 text-center text-xs text-slate-400">
              No assessment attempt logs match current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
