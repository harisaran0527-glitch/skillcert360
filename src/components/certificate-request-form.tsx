"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, Lock, Send } from "lucide-react";

function getTodayLocalDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CertificateRequestModalForm({ studentName, registerNumber, skillId, courseId, courseTitle, providerName, isSubmitted, assessmentPassed, assessmentFailed, certificateAvailable }: {
  studentName: string; registerNumber: string; skillId: string; courseId: string;
  courseTitle: string; providerName: string; isSubmitted: boolean;
  assessmentPassed: boolean; assessmentFailed: boolean; certificateAvailable: boolean;
}) {
  const router = useRouter();
  const todayStr = getTodayLocalDate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(isSubmitted);
  const [completionDate, setCompletionDate] = useState(todayStr);
  const [declaration, setDeclaration] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(submitted ? "/api/student/assessment/start" : "/api/student/certificate-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitted ? { skillId } : { skillId, courseId, completionDate, declaration }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Unable to submit request. Please retry.");
        if (response.status === 409 && !submitted) router.refresh();
        return;
      }
      setSubmitted(true);
      if (payload.redirect) {
        router.push(payload.redirect);
        router.refresh();
      } else setError(payload.assessmentError || "Request saved. Continue to your assessment.");
    } catch {
      setError("Unable to connect. Refresh to check your request, then retry.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/90 p-6 space-y-5 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <h1 className="flex items-center gap-2 text-lg font-bold text-white"><Award className="h-5 w-5 text-cyan-300" />Certificate Request Form</h1>
        <span className="text-xs font-bold text-amber-300">{certificateAvailable ? "Certificate Available / Issued" : <><Lock className="inline h-3 w-3" /> Certificate Locked</>}</span>
      </div>
      <p className="text-xs text-slate-300">
        Learning Completed → {submitted ? "Request Submitted" : "Request Not Submitted"} → {assessmentPassed ? "Passed" : assessmentFailed ? "Assessment Failed → Certificate Locked" : submitted ? "Assessment Ready / In Progress" : "Assessment Not Started"}
      </p>
      <form onSubmit={submit} className="space-y-4 text-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          {[["Student Name", studentName], ["Register Number", registerNumber], ["Course Name", courseTitle], ["Course Provider", providerName]].map(([label, value]) => (
            <label key={label} className="block space-y-1 text-slate-300">{label}
              <input readOnly value={value} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-white" />
            </label>
          ))}
        </div>
        {!submitted && <>
          <label className="block space-y-1 text-slate-300">Completion Date
            <input type="date" required max={todayStr} value={completionDate} onChange={event => setCompletionDate(event.target.value)} className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-white" />
          </label>
          <label className="flex items-center gap-2 text-slate-200">
            <input type="checkbox" required checked={declaration} onChange={event => setDeclaration(event.target.checked)} />
            I confirm that I have completed this course.
          </label>
        </>}
        {error && <p role="alert" className="rounded-xl border border-amber-500/40 p-3 text-amber-200">{error}</p>}
        {!assessmentPassed && <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white disabled:opacity-50">
          <Send className="h-3.5 w-3.5" />{submitting ? "Please wait..." : submitted ? "Continue to Assessment" : "Submit Request"}
        </button>}
        {certificateAvailable && <Link href="/student/certificates" className="block text-center font-bold text-emerald-300">View / Download Certificate</Link>}
      </form>
    </div>
  );
}
