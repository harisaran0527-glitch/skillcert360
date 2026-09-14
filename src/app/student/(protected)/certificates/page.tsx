import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isStorageConfigured } from "@/lib/storage";
import { CertificateSubmissionForm } from "@/components/certificate-submission-form";
import {
  FileCheck2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Clock,
  XCircle,
  Sparkles,
  Award,
  FileText,
  Paperclip,
  Download,
} from "lucide-react";

export default async function StudentCertificatesPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const [profile, certificates] = await (async () => {
    const prof = await db.studentProfile.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!prof) return [null, []] as const;
    const certs = await db.certificate.findMany({
      where: { studentId: prof.id },
      include: {
        skill: {
          include: {
            level: true,
          },
        },
        verifiedBy: { select: { email: true } },
        course: { select: { title: true, name: true } },
        provider: { select: { name: true } },
        reviews: {
          include: { actor: { select: { email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
    return [prof, certs] as const;
  })();

  if (!profile) redirect("/student/login");

  const eligible = certificates.filter((c) =>
    ["UNLOCKED", "REJECTED", "NEEDS_RESUBMISSION", "PENDING_SUBMISSION"].includes(c.status)
  );

  const storageConfigured = isStorageConfigured();

  function formatBytes(bytes: number | null): string {
    if (!bytes) return "File";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Official Credential Verification Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white font-display">Submit & Track Certificates</h1>
        <p className="text-xs text-slate-400 mt-1">
          Submit authentic external certificate files or official URLs to unlock higher progression tiers after passing assessments.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Left Column: Certificate Submission Form Component */}
        <CertificateSubmissionForm
          eligible={eligible}
          storageConfigured={storageConfigured}
        />

        {/* Right Column: Submission History */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Award className="h-5 w-5 text-cyan-400" />
              <span>Certificate History & Status</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{certificates.length} Total</span>
          </div>

          <div className="space-y-4">
            {certificates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <FileCheck2 className="h-8 w-8 text-slate-500 mx-auto" />
                <p className="font-semibold text-white">No certificate records submitted yet.</p>
                <p>Pass a skill assessment to qualify for official certificate submission.</p>
              </div>
            ) : (
              certificates.map((cert) => {
                const isVerified = cert.status === "VERIFIED";
                const isPending = ["SUBMITTED", "PENDING_VERIFICATION"].includes(cert.status);
                const isRejected = cert.status === "REJECTED";
                const isResubmit = cert.status === "NEEDS_RESUBMISSION";

                return (
                  <div
                    key={cert.id}
                    className={`rounded-2xl border p-5 space-y-3 transition-all ${
                      isVerified
                        ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent shadow-lg shadow-emerald-500/5"
                        : isPending
                        ? "border-cyan-500/30 bg-slate-900/80"
                        : isRejected
                        ? "border-rose-500/40 bg-rose-500/10"
                        : "border-amber-500/40 bg-amber-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                          {cert.skill.level.name}
                        </span>
                        <h3 className="mt-1.5 text-base font-bold text-white font-display">{cert.skill.name}</h3>
                        {cert.course && (
                          <p className="mt-2 text-xs text-cyan-300">
                            {cert.provider?.name} · {cert.course.title ?? cert.course.name} · {cert.credentialType}
                          </p>
                        )}
                      </div>

                      <div>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            <ShieldCheck className="h-3 w-3" /> VERIFIED ✓
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                            <Clock className="h-3 w-3" /> PENDING REVIEW
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                            <XCircle className="h-3 w-3" /> REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                            <AlertCircle className="h-3 w-3" /> RESUBMIT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Verified Evidence Links / Badges */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {cert.officialUrl && (
                        <a
                          href={cert.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline"
                        >
                          <span>Verify Link: {cert.officialUrl}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}

                      {cert.filePath && (
                        <a
                          href={`/api/certificates/${cert.id}/file`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-cyan-400" />
                          <span>
                            View File ({cert.originalFileName || "Certificate"} • {formatBytes(cert.fileSize)})
                          </span>
                        </a>
                      )}

                      {(cert.status === "UNLOCKED" || cert.status === "VERIFIED") && (
                        <a
                          href={`/api/certificates/${cert.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5 text-emerald-400" />
                          <span>View / Download Certificate</span>
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800/60 font-mono">
                      <div>
                        <span className="text-slate-500 block">Credential ID:</span>
                        <span className="font-semibold text-slate-200">{cert.credentialId || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Issued Date:</span>
                        <span className="font-semibold text-slate-200">
                          {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>

                    {cert.remarks && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300">
                        <span className="font-bold text-amber-300">Admin Remarks: </span>
                        {cert.remarks}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
