import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { cataloguePage, param, type CatalogueParams } from "@/lib/catalog";
import { ActiveField, CatalogueFilters, CataloguePagination, catalogueInput } from "@/components/catalog-admin-controls";
import { db } from "@/lib/db";
import { BookOpen, Plus, Sparkles, Layers, ShieldCheck } from "lucide-react";

export default async function AdminSkillsPage({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  const params = await searchParams;
  const where: Prisma.SkillWhereInput = {
    ...(param(params, "q") ? { name: { contains: param(params, "q"), mode: "insensitive" } } : {}),
    ...(param(params, "category") ? { categoryId: param(params, "category") } : {}),
    ...(param(params, "level") ? { levelId: param(params, "level") } : {}),
    ...(["true", "false"].includes(param(params, "active")) ? { active: param(params, "active") === "true" } : {}),
  };
  const total = await db.skill.count({ where });
  const page = Math.min(cataloguePage(param(params, "page")), Math.max(1, Math.ceil(total / 24)));
  const editing = param(params, "edit") ? await db.skill.findUnique({ where: { id: param(params, "edit") } }) : null;
  const [categories, levels, skills] = await Promise.all([
    db.skillCategory.findMany({ orderBy: { name: "asc" } }),
    db.skillLevel.findMany({ orderBy: { order: "asc" } }),
    db.skill.findMany({ where, include: { category: true, level: true, _count: { select: { courses: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * 24, take: 24 }),
  ]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Curriculum Operations HQ</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Skill Catalogue Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure platform skills, map category domains, and assign progression tiers.
          </p>
        </div>
        <span className="text-xs font-mono text-indigo-400 font-bold bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          {total} Matching Skills
        </span>
      </div>

      <CatalogueFilters params={params} path="/admin/skills" filters={[{ name: "category", label: "categories", options: categories }, { name: "level", label: "levels", options: levels }]} />
      {/* Add Skill Form */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-display">{editing ? "Edit Skill Definition" : "Create Skill Definition"}</h2>
            <p className="text-[11px] text-slate-400">Add new skill record to the student catalogue.</p>
          </div>
        </div>

        <form key={editing?.id ?? "new"} action="/api/admin/skills" method="post" className="grid gap-4 text-xs md:grid-cols-2">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <label>Slug<input name="slug" required defaultValue={editing?.slug} placeholder="e.g. c-plus-plus" className={catalogueInput} /></label>
          <ActiveField active={editing?.active} />
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Skill Name</label>
            <input
              name="name"
              defaultValue={editing?.name}
              required
              placeholder="e.g. Full-Stack Web Development"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Category Domain</label>
            <select
              name="categoryId"
              defaultValue={editing?.categoryId}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Progression Level Tier</label>
            <select
              name="levelId"
              defaultValue={editing?.levelId}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {levels.map((level) => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Description (Optional)</label>
            <input
              name="description"
              defaultValue={editing?.description ?? ""}
              placeholder="Brief course objectives..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Save Skill Definition</span>
            </button>
          </div>
        </form>
      </div>

      {/* Skills Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => (
          <div key={skill.id} className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
                  {skill.category.name}
                </span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                  {skill.level.name} Tier
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-white font-display">{skill.name}</h3>
              {skill.description && <p className="mt-2 text-xs text-slate-400 leading-relaxed">{skill.description}</p>}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>ID: {skill.id.slice(0, 8)}</span>
              <span className="text-emerald-400 font-bold">{skill.active ? "Active" : "Inactive"}</span>
            </div>
            <div className="flex gap-4 text-xs text-cyan-300"><Link href={`/admin/skills?edit=${skill.id}`}>Edit skill</Link><Link href={`/admin/courses?skill=${skill.id}`}>{skill._count.courses} linked courses</Link></div>
          </div>
        ))}
      </div>
      <CataloguePagination params={params} path="/admin/skills" page={page} total={total} />
    </div>
  );
}
