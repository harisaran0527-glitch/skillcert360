import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminCoursesPage() {
  const [courses, skills, providers, levels] = await Promise.all([
    db.course.findMany({ include: { skill: true, provider: true, level: true }, orderBy: { name: "asc" } }),
    db.skill.findMany({ orderBy: { name: "asc" } }),
    db.provider.findMany({ orderBy: { name: "asc" } }),
    db.skillLevel.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">Courses</h1>
        </div>
        <Link href="/admin/dashboard" className="text-sm font-semibold text-[#1e6fd9]">← Dashboard</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-[#10233f]">Add course</h2>
        <form action="/api/admin/courses" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Course name
            <input name="name" required className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#1e6fd9]" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Skill
            <select name="skillId" required className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 focus:border-[#1e6fd9]">
              {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Provider
            <select name="providerId" required className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 focus:border-[#1e6fd9]">
              {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Level
            <select name="levelId" required className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 focus:border-[#1e6fd9]">
              {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Official URL
            <input name="officialUrl" type="url" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#1e6fd9]" />
          </label>
          <div className="md:col-span-2">
            <button className="rounded-lg bg-[#1e6fd9] px-5 py-3 font-bold text-white">Save</button>
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-xl font-bold text-[#10233f]">{course.name}</h3>
            <p className="mt-2 text-sm text-slate-500">{course.skill.name} · {course.provider.name}</p>
            {course.officialUrl && <a href={course.officialUrl} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-[#1e6fd9]">Official link</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
