import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminSkillsPage() {
  const [categories, levels, skills] = await Promise.all([
    db.skillCategory.findMany({ orderBy: { name: "asc" } }),
    db.skillLevel.findMany({ orderBy: { order: "asc" } }),
    db.skill.findMany({ include: { category: true, level: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">Skills</h1>
        </div>
        <Link href="/admin/dashboard" className="text-sm font-semibold text-[#1e6fd9]">← Dashboard</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-[#10233f]">Add skill</h2>
        <form action="/api/admin/skills" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Skill name
            <input name="name" required className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#1e6fd9]" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Category
            <select name="categoryId" required className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 focus:border-[#1e6fd9]">
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Level
            <select name="levelId" required className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 focus:border-[#1e6fd9]">
              {levels.map((level) => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Description
            <input name="description" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#1e6fd9]" />
          </label>
          <div className="md:col-span-2">
            <button className="rounded-lg bg-[#1e6fd9] px-5 py-3 font-bold text-white">Save</button>
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => (
          <div key={skill.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-xl font-bold text-[#10233f]">{skill.name}</h3>
            <p className="mt-2 text-sm text-slate-500">{skill.category.name} · {skill.level.name}</p>
            {skill.description && <p className="mt-3 text-sm text-slate-600">{skill.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
