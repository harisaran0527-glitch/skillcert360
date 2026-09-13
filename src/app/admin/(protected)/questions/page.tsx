import Link from "next/link";
import { db } from "@/lib/db";
import { HelpCircle, Plus, BookOpen, Layers } from "lucide-react";

export default async function AdminQuestionsPage() {
  const [skills, levels, questions] = await Promise.all([
    db.skill.findMany({ orderBy: { name: "asc" } }),
    db.skillLevel.findMany({ orderBy: { order: "asc" } }),
    db.question.findMany({ include: { skill: true, level: true }, orderBy: { prompt: "asc" }, take: 200 }),
  ]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Assessment Question Bank HQ</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Question Bank Repository</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create and maintain evaluation items for skill assessments.
          </p>
        </div>
        <span className="text-xs font-mono text-indigo-400 font-bold bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          {questions.length} Total Items
        </span>
      </div>

      {/* Add Question Form */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-display">Create Assessment Question</h2>
            <p className="text-[11px] text-slate-400">Add a new question item to the bank.</p>
          </div>
        </div>

        <form action="/api/admin/questions" method="post" className="grid gap-4 text-xs md:grid-cols-2">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Target Skill</label>
            <select
              name="skillId"
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Progression Level Tier</label>
            <select
              name="levelId"
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {levels.map((level) => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Question Type</label>
            <select
              name="type"
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="SINGLE_CHOICE">Single Choice (Radio)</option>
              <option value="MULTIPLE_CHOICE">Multiple Choice (Checkboxes)</option>
              <option value="TRUE_FALSE">True / False</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Difficulty Level</label>
            <select
              name="difficulty"
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="font-semibold text-slate-300 block">Question Prompt</label>
            <textarea
              name="prompt"
              required
              rows={3}
              placeholder="State the question clearly..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="font-semibold text-slate-300 block">Answer Options (One per line)</label>
            <textarea
              name="options"
              required
              rows={4}
              placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Exact Correct Answer</label>
            <input
              name="correctAnswer"
              required
              placeholder="Option A"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Explanation (Optional)</label>
            <input
              name="explanation"
              placeholder="Rationale for correct choice..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Save Question Item</span>
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white font-display border-b border-slate-800 pb-3">
          Configured Question Items
        </h2>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-indigo-300">{q.skill.name}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                    {q.type}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    {q.difficulty}
                  </span>
                </div>
              </div>
              <p className="text-sm font-semibold text-white font-display pt-1">{q.prompt}</p>
              <p className="text-[11px] text-slate-400 font-mono">Tier: {q.level.name}</p>
            </div>
          ))}
          {!questions.length && (
            <p className="text-xs text-slate-500 p-6 text-center">No question items found in the repository.</p>
          )}
        </div>
      </div>
    </div>
  );
}
