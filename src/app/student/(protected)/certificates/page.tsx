import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SkillLockerUploadForm } from "@/components/skill-locker-upload-form";
import {
  ShieldCheck,
  Clock,
  XCircle,
  Sparkles,
  FileText,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default async function StudentSkillLockerPage({
  searchParams,
}: {
  searchParams: Promise<{ skillId?: string; courseId?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const { skillId, courseId } = await searchParams;

  const profile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true, fullName: true },
  });

  if (!profile) redirect("/student/login");

  const [skills, courses, certificates] = await Promise.all([
    db.skill.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.course.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        title: true,
        skillId: true,
        provider: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.certificate.findMany({
      where: { studentId: profile.id },
      include: {
        skill: { select: { name: true } },
        course: { select: { name: true, title: true } },
        provider: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Filter valid statuses for display
  const validCertificates = certificates.filter((c) =>
    ["PENDING_VERIFICATION", "VERIFIED", "REJECTED", "NEEDS_RESUBMISSION"].includes(c.status)
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold text-cyan-300 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Digital Credential Vault</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">
            SkillLocker
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload and manage original certificates issued by official learning providers.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-xs font-mono text-cyan-400 font-bold">
          {validCertificates.length} Certificates Stored
        </div>
      </div>

      {/* Upload Section */}
      <SkillLockerUploadForm
        skills={skills}
        courses={courses}
        preselectedSkillId={skillId}
        preselectedCourseId={courseId}
      />

      {/* Certificate History Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              <span>Certificate History</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review verification status and access your verified credential summaries.
            </p>
          </div>
        </div>

        {validCertificates.length === 0 ? (
          <div className="text-center py-12 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
            <FileText className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300 font-display">No Certificates Uploaded</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You have not uploaded any original certificates yet. Complete an official provider course and upload your certificate above.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {validCertificates.map((cert) => {
              const providerName = cert.provider?.name || "Official Provider";
              const courseTitle = cert.course?.title || cert.course?.name || "Official Course";
              const formattedIssueDate = cert.issueDate
                ? new Date(cert.issueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A";

              return (
                <div
                  key={cert.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Status badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white font-display text-sm">
                        {cert.skill.name}
                      </span>
                      {cert.status === "VERIFIED" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 text-[10px] font-bold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> VERIFIED
                        </span>
                      )}
                      {cert.status === "PENDING_VERIFICATION" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-0.5 text-[10px] font-bold text-amber-300">
                          <Clock className="h-3 w-3" /> PENDING VERIFICATION
                        </span>
                      )}
                      {cert.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-0.5 text-[10px] font-bold text-rose-300">
                          <XCircle className="h-3 w-3" /> REJECTED
                        </span>
                      )}
                      {cert.status === "NEEDS_RESUBMISSION" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-0.5 text-[10px] font-bold text-amber-300">
                          <RefreshCw className="h-3 w-3" /> NEEDS RESUBMISSION
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/60 text-slate-300">
                      <div>
                        <span className="text-slate-400">Course: </span>
                        <strong className="text-slate-200">{courseTitle}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Original Provider: </span>
                        <strong className="text-cyan-300">{providerName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Title: </span>
                        <strong className="text-white">{cert.certificateTitle || courseTitle}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Credential ID: </span>
                        <strong className="font-mono text-slate-200">{cert.credentialId || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Issue Date: </span>
                        <strong className="text-slate-200">{formattedIssueDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Original File: </span>
                        <strong className="font-mono text-slate-300">{cert.originalFileName || "Uploaded File"}</strong>
                      </div>
                    </div>

                    {/* Status Messages */}
                    {cert.status === "PENDING_VERIFICATION" && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-amber-300 text-[11px] font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                        <span>Pending Admin Verification — Your uploaded certificate is being reviewed by SkillCert 360 administrators.</span>
                      </div>
                    )}

                    {cert.status === "REJECTED" && (
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-rose-300 text-[11px] font-medium space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="h-3.5 w-3.5" /> Rejection Reason:
                        </div>
                        <p className="text-rose-200/90">{cert.rejectionReason || cert.remarks || "Certificate could not be verified."}</p>
                      </div>
                    )}

                    {cert.status === "NEEDS_RESUBMISSION" && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-amber-300 text-[11px] font-medium space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <RefreshCw className="h-3.5 w-3.5" /> Resubmission Required:
                        </div>
                        <p className="text-amber-200/90">{cert.rejectionReason || cert.remarks || "Please upload a clearer or updated certificate."}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions for VERIFIED certificates */}
                  {cert.status === "VERIFIED" && (
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                      <a
                        href={`/api/certificates/${cert.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View Original Certificate
                      </a>
                      <a
                        href={`/api/certificates/${cert.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> View Verified Credential Summary
                      </a>
                      <a
                        href={`/api/certificates/${cert.id}/download?format=download`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:from-emerald-500 hover:to-teal-500 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" /> Download Summary
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
