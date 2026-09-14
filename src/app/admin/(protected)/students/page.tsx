import { displaySection } from "@/lib/ui-options";
import { productionStudentWhere } from "@/lib/production-ui";
import { isValidSection } from "@/lib/ui-options";
import { SectionSelect } from "@/components/section-select";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCleanDepartments } from "@/lib/academic";
import {
  Users,
  UserPlus,
  Search,
  ExternalLink,
  Eye,
  KeyRound,
  ShieldOff,
  ShieldCheck,
  Copy,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PasswordField } from "@/components/password-field";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    deleted?: string;
    q?: string;
    dept?: string;
    section?: string;
    cEmail?: string;
    cReg?: string;
    cName?: string;
    cPwd?: string;
  }>;
}) {
  const { error, created, deleted, q, dept, section, cEmail, cReg, cName, cPwd } =
    await searchParams;

  const [rawStudents, departments] = await Promise.all([
    db.studentProfile.findMany({
      where: productionStudentWhere,
      include: {
        user: true,
        department: true,
        section: true,
        certificates: { where: { status: "VERIFIED" } },
      },
      orderBy: { fullName: "asc" },
    }),
    getCleanDepartments(),
  ]);

  const query = (q ?? "").trim().toLowerCase();
  const selectedDept = (dept ?? "").trim();

  const students = rawStudents.map((st) => ({
    ...st,
    verifiedCount: st.certificates.length,
  }));

  const filteredStudents = students.filter((st) => {
    const matchesQ =
      !query ||
      [st.fullName, st.registerNumber, st.user.email]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesDept = !selectedDept || st.departmentId === selectedDept;
    return matchesQ && matchesDept && (!section || !isValidSection(section) || st.section.name === section);
  });

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>Student Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">
            Student Accounts & Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Provision student accounts, manage credentials, and view Student 360 profiles.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          <span>{filteredStudents.length} Student Records</span>
        </div>
      </div>

      {/* ── One-Time Credentials Banner ────────────────────────── */}
      {created && cEmail && cReg && cPwd && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Student account created — share these credentials with the student NOW. This is the only time the password is shown.
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs font-mono">
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-3 space-y-1">
              <span className="text-slate-400 block uppercase text-[10px] font-bold">Full Name</span>
              <span className="text-white font-semibold">{cName}</span>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-3 space-y-1">
              <span className="text-slate-400 block uppercase text-[10px] font-bold">Email</span>
              <span className="text-cyan-300">{cEmail}</span>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-3 space-y-1">
              <span className="text-slate-400 block uppercase text-[10px] font-bold">Register Number</span>
              <span className="text-cyan-300">{cReg}</span>
            </div>
            <div className="rounded-xl border border-rose-500/30 bg-slate-950/80 p-3 space-y-1">
              <span className="text-rose-400 block uppercase text-[10px] font-bold">⚠ Temp Password (One-Time)</span>
              <span className="text-white font-bold tracking-wide">{cPwd}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Student must change this password on first login. The password will not be shown again after you leave this page.
          </p>
        </div>
      )}

      {created && !cEmail && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-xs font-semibold text-emerald-300">
          ✓ Student account provisioned.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 flex items-center gap-2.5 text-xs font-semibold text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {deleted && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
          ✓ Student account permanently deleted and removed from all records.
        </div>
      )}

      {/* ── Main Grid ──────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        {/* ─ Left: Add Student Form ───────────────────────────── */}
        <div className="glass-panel rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Add Student</h2>
              <p className="text-[11px] text-slate-400">Provision a new student account.</p>
            </div>
          </div>

          <form action="/api/admin/students" method="post" className="space-y-4 text-xs">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Full Name</label>
              <input
                name="fullName"
                required
                placeholder="e.g. Saran Kumar"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Register Number */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Register Number</label>
              <input
                name="registerNumber"
                required
                placeholder="e.g. 717821P101"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Email Address</label>
              <input
                name="email"
                type="email"
                required
                placeholder="student@college.edu"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Department + Section */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Department</label>
                <select
                  name="departmentId"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  {departments.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Section</label>
                <SectionSelect className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-white" />
              </div>
            </div>

            {/* Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Academic Year</label>
                <input
                  name="year"
                  type="number"
                  min="1"
                  max="8"
                  defaultValue="1"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Account Status</label>
                <select
                  name="status"
                  defaultValue="ACTIVE"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
              </div>
            </div>

            {/* Temporary Password */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Temporary Password</label>
              <PasswordField name="temporaryPassword" variant="dark" placeholder="Min 8 characters" />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Confirm Password</label>
              <PasswordField name="confirmPassword" variant="dark" placeholder="Repeat password" />
            </div>

            <button
              id="btn-add-student"
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Student</span>
            </button>
          </form>
        </div>

        {/* ─ Right: Directory ─────────────────────────────────── */}
        <div className="space-y-4">
          {/* Search & Filter */}
          <form method="get" className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search name, register number, email…"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <select
              name="dept"
              defaultValue={selectedDept}
              className="w-full sm:w-48 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <SectionSelect name="section" value={section} filter className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white" />
            <button
              type="submit"
              className="w-full sm:w-auto rounded-xl bg-indigo-600/30 border border-indigo-500/40 px-4 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-600/40 transition-all"
            >
              Filter
            </button>
          </form>

          {/* Table */}
          <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Reg Number</th>
                    <th className="px-5 py-4">Dept / Class</th>
                    <th className="px-5 py-4">Verified Certs</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white font-display">{student.fullName}</div>
                        <div className="text-[11px] text-slate-400">{student.user.email}</div>
                      </td>
                      <td className="px-5 py-4 font-mono text-cyan-300 font-semibold">
                        {student.registerNumber}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {student.department.name} ·{" "}
                        <span className="text-slate-400">
                          Yr {student.year} Sec {displaySection(student.section.name)}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                        {student.verifiedCount}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            student.user.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {student.user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="inline-flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-300 text-[11px]"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Student 360</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStudents.length === 0 && (
                <div className="p-10 text-center text-xs text-slate-400">
                  No student records match the search parameters.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}