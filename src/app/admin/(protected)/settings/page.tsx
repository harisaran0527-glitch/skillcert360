import Link from "next/link";
import { db } from "@/lib/db";
import { getAssessmentSettings } from "@/lib/settings";

export default async function AdminSettingsPage() {
  const settings = await getAssessmentSettings();
  const levels = await db.skillLevel.findMany({ orderBy: { order: "asc" } });
  const map = { assessmentQuestionCount: settings.questionCount, assessmentDurationMinutes: settings.durationMinutes, assessmentViolationLimit: settings.violationLimit, assessmentCooldownHours: settings.cooldownHours, ...settings };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">Settings</h1>
        </div>
        <Link href="/admin/dashboard" className="text-sm font-semibold text-[#1e6fd9]">← Dashboard</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-[#10233f]">Assessment and certificate settings</h2>
        <p className="mt-3 text-sm text-slate-600">Pass marks count correct answers and must be between 1 and the question count. New settings apply to new attempts. At the violation limit, auto-submit grades saved answers; disabling it terminates the attempt as failed. Certificate requirement means prerequisite skills require verified credentials; every certificate still requires an assessment pass.</p>
        <form action="/api/admin/settings" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Questions per assessment<input name="assessmentQuestionCount" defaultValue={Number(map.assessmentQuestionCount ?? 50)} type="number" min="1" max="100" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
          <label className="text-sm font-semibold text-slate-700">Exam duration (minutes)<input name="assessmentDurationMinutes" defaultValue={Number(map.assessmentDurationMinutes ?? 45)} type="number" min="1" max="180" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
          <label className="text-sm font-semibold text-slate-700">Violation limit<input name="assessmentViolationLimit" defaultValue={Number(map.assessmentViolationLimit ?? 3)} type="number" min="1" max="100" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
          <label className="text-sm font-semibold text-slate-700">Re-exam cooldown (hours)<input name="assessmentCooldownHours" defaultValue={Number(map.assessmentCooldownHours ?? 6)} type="number" min="0" step="0.001" max="168" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
{levels.map(level => <label key={level.id}>{level.name} pass mark (correct answers)<input name={`passMarks.${level.name}`} defaultValue={settings.passMarksByLevel[level.name] ?? level.passMark} type="number" min="1" max="100" required className="mt-2 w-full rounded-lg border px-3 py-2" /></label>)}
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 md:col-span-2"><input type="checkbox" name="certificateRequirement" defaultChecked={Boolean(map.certificateRequirement ?? true)} className="h-4 w-4" /> Certificate requirement enabled</label>
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 md:col-span-2"><input type="checkbox" name="autoSubmitOnViolation" defaultChecked={Boolean(map.autoSubmitOnViolation ?? true)} className="h-4 w-4" /> Auto-submit on violation limit</label>
          <div className="md:col-span-2"><button className="rounded-lg bg-[#1e6fd9] px-5 py-3 font-bold text-white">Save settings</button></div>
        </form>
      </div>
    </div>
  );
}
