import { productionStudentWhere, productionSkillWhere } from "@/lib/production-ui";
import { db } from "@/lib/db";
import Link from "next/link";
import { AdminCertificatePreviewModal } from "@/components/admin-certificate-preview-modal";
import {
  FileCheck2,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Paperclip,
} from "lucide-react";

export default async function AdminCertificatesPage() {
  const certificates = await db.certificate.findMany({
    where: { student: productionStudentWhere, skill: productionSkillWhere },
    include: {
      student: true,
      skill: true,
      course: { select: { title: true, name: true } },
      provider: { select: { name: true } },
      verifiedBy: { select: { email: true } },
      reviews: {
        include: { actor: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  const pending = certificates.filter((c) => ["SUBMITTED", "PENDING_VERIFICATION"].includes(c.status));
  const verified = certificates.filter((c) => c.status === "VERIFIED");
  const other = certificates.filter((c) => ["REJECTED", "NEEDS_RESUBMISSION"].includes(c.status));

  function formatBytes(bytes: number | null): string {
    if (!bytes) return "File";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Credential Verification HQ</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Certificate Verification Queue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit submitted official certificate files, URLs, and credential IDs to approve progression unlocking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 rounded-xl px-3.5 py-2">
            {pending.length} Pending Review
          </span>
          <span className="text-xs font-mono text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3.5 py-2">
            {verified.length} Verified
          </span>
        </div>
      </div>

      {/* Pending Queue Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-amber-400 font-display flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span>Pending Verification Queue ({pending.length})</span>
        </h2>

        {pending.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-xs text-slate-400">
            No certificate submissions currently awaiting admin review.
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((c) => (
              <div key={c.id} className="glass-panel rounded-3xl p-6 sm:p-8 border-amber-500/30 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                      {c.skill.name}
                    </span>
                    <h3 className="text-xl font-bold text-white font-display mt-1">
                      <Link href={`/admin/students/${c.studentId}`} className="hover:text-indigo-300 transition-colors">
                        {c.student.fullName}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">Reg No: {c.student.registerNumber}</p>
                    {c.course && <p className="mt-2 text-xs text-cyan-300">{c.provider?.name} · {c.course.title ?? c.course.name} · {c.credentialType}</p>}
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
                    <Clock className="h-3.5 w-3.5" /> PENDING REVIEW
                  </span>
                </div>

                {/* Submission Details Grid */}
                <div className="grid gap-3 sm:grid-cols-4 text-xs text-slate-300">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Credential ID</span>
                    <span className="font-mono font-bold text-white mt-0.5 block">{c.credentialId ?? "Not provided"}</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Issue Date</span>
                    <span className="font-semibold text-white mt-0.5 block">
                      {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "Not provided"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Submitted Time</span>
                    <span className="font-semibold text-white mt-0.5 block">
                      {c.submittedAt ? new Date(c.submittedAt).toLocaleString() : "Not submitted"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Uploaded File</span>
                    <span className="font-semibold text-cyan-300 mt-0.5 block truncate">
                      {c.filePath ? `${c.originalFileName || "File"} (${formatBytes(c.fileSize)})` : "No file attached"}
                    </span>
                  </div>
                </div>

                {/* Evidence Attachments & Verification Links */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {c.officialUrl && (
                    <a
                      href={c.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all"
                    >
                      <span>Verify Official URL: {c.officialUrl}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  {c.filePath && (
                    <AdminCertificatePreviewModal
                      certificateId={c.id}
                      originalFileName={c.originalFileName}
                      mimeType={c.mimeType}
                      fileSize={c.fileSize}
                    />
                  )}
                </div>

                {/* Review Form */}
                <form action="/api/admin/certificates" method="post" className="pt-3 border-t border-slate-800 space-y-4">
                  <input type="hidden" name="certificateId" value={c.id} />
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Admin Verification Remarks</label>
                    <textarea
                      name="remarks"
                      maxLength={2000}
                      rows={2}
                      placeholder="Optional remarks regarding credential authenticity..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      name="status"
                      value="VERIFIED"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approve & Unlock</span>
                    </button>
                    <button
                      name="status"
                      value="REJECTED"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-all cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject Credential</span>
                    </button>
                    <button
                      name="status"
                      value="NEEDS_RESUBMISSION"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>Request Resubmission</span>
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Verified History Section */}
      <section className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-emerald-400 font-display flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <span>Verified Credentials Log ({verified.length})</span>
        </h2>

        <div className="space-y-3">
          {verified.map((c) => (
            <div key={c.id} className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-emerald-500/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm font-display">{c.student.fullName}</span>
                  <span className="text-xs text-slate-400 font-mono">({c.student.registerNumber})</span>
                </div>
                <p className="text-xs text-cyan-300 font-semibold">{c.skill.name}</p>
                {c.course && <p className="text-xs text-slate-300">{c.provider?.name} · {c.course.title ?? c.course.name} · {c.credentialType}</p>}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {c.officialUrl && (
                    <a href={c.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline">
                      <span>{c.officialUrl}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {c.filePath && (
                    <AdminCertificatePreviewModal
                      certificateId={c.id}
                      originalFileName={c.originalFileName}
                      mimeType={c.mimeType}
                      fileSize={c.fileSize}
                    />
                  )}
                </div>
              </div>

              <div className="text-right text-xs space-y-1">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  VERIFIED ✓
                </span>
                <p className="text-[11px] text-slate-400 font-mono">Verified by: {c.verifiedBy?.email ?? "Admin"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
