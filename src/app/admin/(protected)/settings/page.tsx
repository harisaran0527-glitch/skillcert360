import Link from "next/link";
import { db } from "@/lib/db";
import { getAssessmentSettings } from "@/lib/settings";
import { Sliders, ShieldAlert, Clock, Award, CheckCircle2, Save, HelpCircle } from "lucide-react";

export default async function AdminSettingsPage() {
  const settings = await getAssessmentSettings();
  const levels = await db.skillLevel.findMany({ orderBy: { order: "asc" } });
  const map = {
    assessmentQuestionCount: settings.questionCount,
    assessmentDurationMinutes: settings.durationMinutes,
    assessmentViolationLimit: settings.violationLimit,
    assessmentCooldownHours: settings.cooldownHours,
    ...settings,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <Sliders className="w-4 h-4" /> System Administration
          </div>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Platform Settings & Configuration
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage global assessment parameters, proctoring security thresholds, pass criteria, and verification rules.
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all self-start sm:self-center"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Info Card */}
      <div className="glass-panel p-5 border-l-4 border-l-cyan-500 flex gap-4 items-start">
        <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
          <p className="font-semibold text-cyan-200">Important System Policy Notes:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
            <li>Pass marks count exact correct answers and must be between 1 and the question count.</li>
            <li>New settings apply immediately to all freshly initialized assessment attempts.</li>
            <li>When violation limit is hit with auto-submit enabled, saved answers are graded; disabling auto-submit terminates the attempt immediately as failed.</li>
            <li>Certificate requirement enforces that prerequisite skill levels require verified credentials before proceeding.</li>
          </ul>
        </div>
      </div>

      {/* Settings Form */}
      <form action="/api/admin/settings" method="post" className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Section 1: Assessment Execution */}
          <div className="glass-panel p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Assessment Execution</h2>
                <p className="text-xs text-slate-400">Question pool and timer limits per attempt</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Questions Per Assessment
                </label>
                <input
                  name="assessmentQuestionCount"
                  defaultValue={Number(map.assessmentQuestionCount ?? 50)}
                  type="number"
                  min="1"
                  max="100"
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                />
                <p className="mt-1 text-[11px] text-slate-500">Number of randomized questions served to the student.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Exam Duration (Minutes)
                </label>
                <input
                  name="assessmentDurationMinutes"
                  defaultValue={Number(map.assessmentDurationMinutes ?? 45)}
                  type="number"
                  min="1"
                  max="180"
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                />
                <p className="mt-1 text-[11px] text-slate-500">Total allowed time before forced submission.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Re-exam Cooldown (Hours)
                </label>
                <input
                  name="assessmentCooldownHours"
                  defaultValue={Number(map.assessmentCooldownHours ?? 6)}
                  type="number"
                  min="0"
                  step="0.001"
                  max="168"
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                />
                <p className="mt-1 text-[11px] text-slate-500">Waiting period required before retaking a failed exam.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Security & Integrity */}
          <div className="glass-panel p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Security & Integrity</h2>
                <p className="text-xs text-slate-400">Proctoring constraints and automatic actions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Violation Limit (Tab Switch / Blur Count)
                </label>
                <input
                  name="assessmentViolationLimit"
                  defaultValue={Number(map.assessmentViolationLimit ?? 3)}
                  type="number"
                  min="1"
                  max="100"
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                />
                <p className="mt-1 text-[11px] text-slate-500">Maximum permitted tab switches or window defocus warnings.</p>
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 cursor-pointer hover:bg-slate-950/70 transition">
                  <input
                    type="checkbox"
                    name="autoSubmitOnViolation"
                    defaultChecked={Boolean(map.autoSubmitOnViolation ?? true)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">Auto-Submit on Violation Limit</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">Automatically grade and submit current answers when max violations are triggered.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 cursor-pointer hover:bg-slate-950/70 transition">
                  <input
                    type="checkbox"
                    name="certificateRequirement"
                    defaultChecked={Boolean(map.certificateRequirement ?? true)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">Enable Certificate Requirement Policy</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">Enforce verified official certificate checks for progression levels.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Level Pass Marks */}
        <div className="glass-panel p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Level Pass Marks Criteria</h2>
              <p className="text-xs text-slate-400">Specify minimum required correct answers per difficulty level</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {levels.map((level) => (
              <div key={level.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{level.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Order {level.order}</span>
                </div>
                <label className="block text-xs text-slate-300">
                  Required Correct Answers
                  <input
                    name={`passMarks.${level.name}`}
                    defaultValue={settings.passMarksByLevel[level.name] ?? level.passMark}
                    type="number"
                    min="1"
                    max="100"
                    required
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98]"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
}
