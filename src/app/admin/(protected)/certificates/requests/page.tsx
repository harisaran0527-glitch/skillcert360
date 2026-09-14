import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { displaySection } from "@/lib/ui-options";
import {
  FileCheck2,
  Users,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  Award,
  ArrowLeft,
  Filter,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default async function AdminCertificateRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin/login");

  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const selectedStatus = (params.status ?? "").trim();

  // Fetch all certificate submissions with full student, course, provider, and attempt data
  const certificates = await db.certificate.findMany({
    include: {
      student: {
        include: {
          user: true,
          department: true,
          section: true,
          attempts: {
            orderBy: { startedAt: "desc" },
            take: 5,
          },
          skills: true,
        },
      },
      skill: true,
      course: {
        include: { provider: true },
      },
      provider: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  // Filter in memory for maximum speed and clean display
  const filtered = certificates.filter((cert) => {
    const student = cert.student;
    const nameMatch =
      !query ||
      student.fullName.toLowerCase().includes(query) ||
      student.registerNumber.toLowerCase().includes(query) ||
      student.user.email.toLowerCase().includes(query) ||
      cert.skill.name.toLowerCase().includes(query) ||
      (cert.course?.name || "").toLowerCase().includes(query) ||
      (cert.provider?.name || "").toLowerCase().includes(query);

    const statusMatch = !selectedStatus || cert.status === selectedStatus;

    return nameMatch && statusMatch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-2">
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Certificate Requests Command Log</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Certificate Request Form Submissions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time track of student eligibility submissions, learning status, assessment results, and certificate lock states.
          </p>
        </div>

        <Link
          href="/admin/certificates"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Certificates HQ
        </Link>
      </div>

      {/* Filter Bar */}
      <form method="get" className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-slate-500 shrink-0" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search student name, reg no, course, provider..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={selectedStatus}
            className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Form Statuses</option>
            <option value="SUBMITTED">FORM SUBMITTED</option>
            <option value="UNLOCKED">UNLOCKED / PASSED</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="LOCKED">LOCKED</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Requests Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Department & Class</th>
                <th className="px-6 py-4">Course & Provider</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4">Learning Status</th>
                <th className="px-6 py-4">Assessment Status</th>
                <th className="px-6 py-4">Certificate Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No certificate request submissions found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((cert) => {
                  const student = cert.student;
                  const skillAttempts = student.attempts.filter((a) => a.skillId === cert.skillId);
                  const latestAttempt = skillAttempts[0];

                  const assessmentStatus = !latestAttempt
                    ? "ASSESSMENT PENDING"
                    : latestAttempt.passed === true
                    ? "PASSED"
                    : latestAttempt.passed === false
                    ? "FAILED"
                    : "IN PROGRESS";

                  const certStatus = cert.status === "UNLOCKED" || cert.status === "VERIFIED"
                    ? "CERTIFICATE ISSUED"
                    : "LOCKED";

                  return (
                    <tr key={cert.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white font-display">{student.fullName}</div>
                        <div className="text-[11px] font-mono text-cyan-400">{student.registerNumber}</div>
                        <div className="text-[10px] text-slate-500">{student.user.email}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{student.department.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Year {student.year} · Sec {displaySection(student.section.name)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-cyan-300">
                          {cert.provider?.name || cert.course?.provider?.name || "Official Provider"}
                        </div>
                        <div className="text-slate-200 max-w-xs truncate">
                          {cert.course?.title || cert.course?.name || cert.skill.name}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                        {cert.submittedAt ? new Date(cert.submittedAt).toLocaleString() : "N/A"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> COMPLETED
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {assessmentStatus === "PASSED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> PASSED
                          </span>
                        ) : assessmentStatus === "FAILED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                            <XCircle className="h-3 w-3" /> FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                            <Clock className="h-3 w-3" /> ASSESSMENT PENDING
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {certStatus === "CERTIFICATE ISSUED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            <ShieldCheck className="h-3 w-3" /> CERTIFICATE ISSUED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
                            <Lock className="h-3 w-3 text-amber-400" /> LOCKED
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          View Student 360 →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
