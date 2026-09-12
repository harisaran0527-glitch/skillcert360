import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminQuestionsPage() {
  const [skills, levels, questions] = await Promise.all([
    db.skill.findMany({ orderBy: { name: "asc" } }),
    db.skillLevel.findMany({ orderBy: { order: "asc" } }),
    db.question.findMany({ include: { skill: true, level: true }, orderBy: { prompt: "asc" }, take: 200 }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">Question Bank</h1>
        </div>
        <Link href="/admin/dashboard" className="text-sm font-semibold text-[#1e6fd9]">← Dashboard</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-[#10233f]">Add question</h2>
        <form action="/api/admin/questions" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Skill
            <select name="skillId" required className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Level
            <select name="levelId" required className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Type
            <select name="type" required className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <option value="SINGLE_CHOICE">Single Choice</option>
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE">True / False</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Difficulty
            <select name="difficulty" required className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">Prompt
            <textarea name="prompt" required rows={4} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" />
          </label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">Answer options (one per line)
            <textarea name="options" required rows={5} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" placeholder="Option A&#10;Option B&#10;Option C&#10;Option D" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Correct answer
            <input name="correctAnswer" required className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Explanation
            <input name="explanation" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" />
          </label>
          <div className="md:col-span-2">
            <button className="rounded-lg bg-[#1e6fd9] px-5 py-3 font-bold text-white">Save question</button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-[#10233f]">Question bank</h2>
        <div className="mt-6 space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-[#10233f]">{question.skill.name}</h3>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1e6fd9]">{question.type}</span>
              </div>
              <p className="mt-3 text-slate-700">{question.prompt}</p>
              <p className="mt-2 text-sm text-slate-500">{question.level.name} · {question.difficulty}</p>
            </div>
          ))}
          {!questions.length && <p className="text-sm text-slate-500">No questions yet.</p>}
        </div>
      </div>
    </div>
  );
}
