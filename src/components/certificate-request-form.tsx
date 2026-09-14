"use client";

import { useState } from "react";
import { Award, CheckCircle2, Send, Clock, Lock, Sparkles, User, BookOpen, ShieldCheck } from "lucide-react";

interface CertificateRequestFormProps {
  studentName: string;
  registerNumber: string;
  email: string;
  departmentName: string;
  sectionName: string;
  skillId: string;
  skillName: string;
  courseId: string;
  courseTitle: string;
  providerName: string;
  isSubmitted?: boolean;
  assessmentPassed?: boolean;
}

export function CertificateRequestModalForm({
  studentName,
  registerNumber,
  email,
  departmentName,
  sectionName,
  skillId,
  skillName,
  courseId,
  courseTitle,
  providerName,
  isSubmitted = false,
  assessmentPassed = false,
}: CertificateRequestFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(isSubmitted);
  const [remarks, setRemarks] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/certificate-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, courseId, remarks }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // Keep state safe
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white font-display">Certificate Request Form Submitted</h4>
            <p className="text-xs text-slate-300">
              Form received & visible in Admin Panel. Assessment PASS is required to unlock your certificate.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Form Status</span>
            <span className="text-cyan-300 font-bold">Submitted ✓</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Certificate Status</span>
            <span className={assessmentPassed ? "text-emerald-400 font-bold" : "text-amber-400 font-bold flex items-center gap-1"}>
              {assessmentPassed ? "AVAILABLE / ISSUED" : <><Lock className="h-3 w-3" /> LOCKED (Assessment Pending)</>}
            </span>
          </div>
        </div>

        {!assessmentPassed && (
          <form action="/api/student/assessment/start" method="post">
            <input type="hidden" name="skillId" value={skillId} />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
            >
              <Award className="h-4 w-4" /> Start SkillCert 360 Assessment Now
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/90 p-6 space-y-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">Certificate Request Form</h3>
            <p className="text-xs text-cyan-300">Submit eligibility details for official record</p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Lock className="h-3 w-3" /> Certificate Locked
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Auto-filled Student Details */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Auto-Filled Student Record
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">Student Name</span>
              <span className="font-semibold text-white">{studentName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Register Number</span>
              <span className="font-mono text-cyan-300">{registerNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Email</span>
              <span className="text-slate-300 truncate block">{email}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Department</span>
              <span className="text-slate-200">{departmentName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Section</span>
              <span className="text-slate-200">Sec {sectionName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Provider</span>
              <span className="text-cyan-300 font-semibold">{providerName}</span>
            </div>
          </div>
        </div>

        {/* Selected Course */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 block">Selected Official Course</label>
          <input
            readOnly
            value={`${courseTitle} (${skillName})`}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/90 px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none cursor-not-allowed"
          />
        </div>

        {/* Optional Student Remarks */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 block">Additional Notes / Remarks (Optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Any completion notes or details..."
            rows={2}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/90 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{submitting ? "Submitting Form..." : "Submit Certificate Request"}</span>
        </button>
      </form>
    </div>
  );
}
