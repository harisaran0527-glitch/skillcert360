import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Award, Calendar, BookOpen, User, Building2, FileCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { id } = await params;

  // Search by certificateNumber first, then fall back to id
  const certificate = await db.certificate.findFirst({
    where: {
      OR: [
        { certificateNumber: id },
        { id: id },
      ],
      status: { in: ["UNLOCKED", "VERIFIED"] },
    },
    include: {
      student: {
        select: {
          fullName: true,
          registerNumber: true,
          department: { select: { name: true } },
        },
      },
      skill: { select: { name: true, level: { select: { name: true } } } },
      course: { select: { title: true, name: true } },
      provider: { select: { name: true } },
    },
  });

  if (!certificate) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Certificate</h1>
          <p className="text-slate-400 text-sm mb-6">
            The certificate ID or number <code className="bg-slate-950 px-2 py-1 rounded text-red-300">{id}</code> could not be verified in the SkillCert 360 official registry.
          </p>
          <div className="text-xs text-slate-500 border-t border-slate-700/60 pt-4">
            SkillCert 360 Verification System &bull; Official Registry
          </div>
        </div>
      </div>
    );
  }

  const studentSkill = await db.studentSkill.findUnique({
    where: {
      studentId_skillId: {
        studentId: certificate.studentId,
        skillId: certificate.skillId,
      },
    },
    select: { completedAt: true },
  });

  const submissionDate = certificate.submittedAt
    ? new Date(certificate.submittedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const verificationDate = certificate.verifiedAt || certificate.issuedAt
    ? new Date(certificate.verifiedAt || certificate.issuedAt!).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : submissionDate;

  const providerName = certificate.provider?.name ?? "External Skill Provider";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-3">
            <Award className="w-3.5 h-3.5" /> Official Verification Portal
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            SkillCert 360
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            National Skill Accreditation &amp; Verification System
          </p>
        </div>

        {/* Verification Status Banner */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 mb-8 text-center backdrop-blur shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-300">Verified Credential</h2>
          <p className="text-slate-300 text-sm mt-1">
            This external skill certificate has been uploaded and verified in the SkillCert 360 official registry.
          </p>
          <div className="mt-4 inline-block bg-slate-900/80 border border-emerald-500/30 px-4 py-1.5 rounded-lg text-emerald-400 font-mono text-sm font-semibold">
            Record ID: {certificate.certificateNumber || certificate.id}
          </div>
        </div>

        {/* Detailed Certificate Record */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">

          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-400" /> Credential Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Recipient */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <User className="w-3.5 h-3.5 text-blue-400" /> Student Recipient
              </div>
              <div className="text-lg font-bold text-white">{certificate.student.fullName}</div>
              <div className="text-xs text-slate-400 mt-1">
                Reg No: <span className="text-slate-200 font-semibold">{certificate.student.registerNumber}</span>
              </div>
              {certificate.student.department && (
                <div className="text-xs text-slate-400">
                  Dept: <span className="text-slate-200">{certificate.student.department.name}</span>
                </div>
              )}
            </div>

            {/* Skill & Course */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Skill & Course
              </div>
              <div className="text-lg font-bold text-amber-300">
                {certificate.course?.title ?? certificate.course?.name ?? certificate.skill.name}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Domain: <span className="font-semibold">{certificate.skill.name}</span> ({certificate.skill.level.name})
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-500" /> Original Issuer: <span className="text-slate-200 font-medium">{providerName}</span>
              </div>
            </div>

          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">

            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Submission Date
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-1">{submissionDate}</div>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verification Date
              </div>
              <div className="text-sm font-semibold text-emerald-300 mt-1">{verificationDate}</div>
            </div>

          </div>

          {/* Issuer Wording */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 text-center">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Verification Authority
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              Original Certificate Issuer: {providerName}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Verification &amp; Record Management: SkillCert 360
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              href={`/api/certificates/${certificate.id}/download`}
              target="_blank"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all"
            >
              <Award className="w-4 h-4" /> Download Verified Credential Summary
            </Link>
          </div>

        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          SkillCert 360 National Skill Registry &bull; Verified Credential Management
        </div>

      </div>
    </div>
  );
}
