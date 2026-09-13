import Link from "next/link";
import { CredentialType, PricingType, UrlStatus, type Prisma } from "@prisma/client";
import { cataloguePage, param, type CatalogueParams } from "@/lib/catalog";
import { ActiveField, CatalogueFilters, CataloguePagination, catalogueInput } from "@/components/catalog-admin-controls";
import { CatalogueSkillPicker } from "@/components/catalog-skill-picker";
import { db } from "@/lib/db";
import { deduplicateByNormalizedKey } from "@/lib/academic";
import { GraduationCap, Plus, ExternalLink, Building, BookOpen } from "lucide-react";

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  const params = await searchParams;
  const where: Prisma.CourseWhereInput = {
    ...(param(params, "q") ? { OR: [{ name: { contains: param(params, "q"), mode: "insensitive" as const } }, { skill: { name: { contains: param(params, "q"), mode: "insensitive" as const } } }, { provider: { name: { contains: param(params, "q"), mode: "insensitive" as const } } }] } : {}),
    ...(param(params, "skill") ? { skillId: param(params, "skill") } : {}),
    ...(param(params, "provider") ? { providerId: param(params, "provider") } : {}),
    ...(param(params, "level") ? { levelId: param(params, "level") } : {}),
    ...(Object.values(UrlStatus).includes(param(params, "urlStatus") as UrlStatus) ? { officialUrlStatus: param(params, "urlStatus") as UrlStatus } : {}),
    ...(["true", "false"].includes(param(params, "active")) ? { active: param(params, "active") === "true" } : {}),
  };
  const total = await db.course.count({ where });
  const page = Math.min(cataloguePage(param(params, "page")), Math.max(1, Math.ceil(total / 24)));
  const editing = param(params, "edit") ? await db.course.findUnique({ where: { id: param(params, "edit") }, include: { skill: { include: { level: true } } } }) : null;
  const targetSkill = editing?.skill ?? (param(params, "skill") ? await db.skill.findUnique({ where: { id: param(params, "skill") }, include: { level: true } }) : null);
  const [rawCourses, rawProviders, rawLevels] = await Promise.all([
    db.course.findMany({ where, include: { skill: true, provider: true, level: true }, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * 24, take: 24 }),
    db.provider.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.skillLevel.findMany({ orderBy: { order: "asc" } }),
  ]);

  const courses = deduplicateByNormalizedKey(rawCourses, (c) => `${c.providerId}:${c.skillId}:${c.name}`);
  const providers = deduplicateByNormalizedKey(rawProviders, (p) => p.name);
  const levels = deduplicateByNormalizedKey(rawLevels, (l) => l.name);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Official Provider Course Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Course Curriculum Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Link external official provider courses to internal platform skills.
          </p>
        </div>
        <span className="text-xs font-mono text-indigo-400 font-bold bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          {total} Matching Courses
        </span>
      </div>

      <CatalogueFilters params={params} path="/admin/courses" filters={[{ name: "provider", label: "providers", options: providers }, { name: "level", label: "levels", options: levels }, { name: "urlStatus", label: "URL statuses", options: Object.values(UrlStatus).map(id => ({ id, name: id })) }, ...(targetSkill ? [{ name: "skill", label: "skills", options: [targetSkill] }] : [])]} />
      {/* Add Course Form */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-display">{editing ? "Edit Official Course Mapping" : "Add Official Course Mapping"}</h2>
            <p className="text-[11px] text-slate-400">Map an external course URL to a skill definition.</p>
          </div>
        </div>

        <form key={editing?.id ?? "new"} action="/api/admin/courses" method="post" className="grid gap-4 text-xs md:grid-cols-2">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Course Name</label>
            <input
              name="name"
              defaultValue={editing?.title ?? editing?.name}
              required
              placeholder="e.g. AWS Certified Solutions Architect Course"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Target Skill</label>
            <CatalogueSkillPicker initial={targetSkill} />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Provider Organization</label>
            <select
              name="providerId"
              defaultValue={editing?.providerId ?? param(params, "provider")}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Target Level Tier</label>
            <select
              name="levelId"
              defaultValue={editing?.levelId ?? targetSkill?.levelId}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {levels.map((level) => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="font-semibold text-slate-300 block">Official Provider Course URL</label>
            <input
              name="officialUrl"
              defaultValue={editing && /^https?:\/\//i.test(editing.officialUrl) ? editing.officialUrl : ""}
              type="url"
              placeholder="https://coursera.org/learn/aws-architecture"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <label>Official URL status<select name="officialUrlStatus" defaultValue={editing?.officialUrlStatus ?? "OFFICIAL_LINK_PENDING"} className={catalogueInput}>{Object.values(UrlStatus).map(value => <option key={value}>{value}</option>)}</select></label>
          <label>Duration<input name="duration" defaultValue={editing?.duration ?? (editing?.durationMinutes ? `${editing.durationMinutes} minutes` : "")} placeholder="e.g. 10 hours" className={catalogueInput} /></label>
          <label>Pricing<select name="pricingType" defaultValue={editing?.pricingType ?? "FREE"} className={catalogueInput}>{Object.values(PricingType).map(value => <option key={value}>{value}</option>)}</select></label>
          <label>Credential availability<select name="credentialAvailable" defaultValue={String(editing?.credentialAvailable ?? false)} className={catalogueInput}><option value="false">No credential</option><option value="true">Credential available</option></select></label>
          <label>Credential type<select name="credentialType" defaultValue={editing?.credentialType ?? "NONE"} className={catalogueInput}>{Object.values(CredentialType).map(value => <option key={value}>{value}</option>)}</select></label>
          <ActiveField active={editing?.active} />
          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Save Course Record</span>
            </button>
          </div>
        </form>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                  {course.provider.name}
                </span>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
                  {course.skill.name}
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-white font-display">{course.title ?? course.name}</h3>
              <p className="mt-2 text-xs text-slate-300">{course.level.name} · {course.duration || (course.durationMinutes ? `${course.durationMinutes} minutes` : "Duration not specified")} · {course.pricingType}</p>
              <p className="mt-2 text-xs text-slate-400">{course.credentialAvailable ? "Credential available" : "No credential"} · {course.credentialType}</p>
              <p className="mt-2 text-xs text-slate-400">{course.officialUrlStatus} · {course.active ? "Active" : "Inactive"}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              {/^https?:\/\//i.test(course.officialUrl) ? (
                <a
                  href={course.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:underline"
                >
                  <span>Official URL</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-slate-500">No URL configured</span>
              )}
            </div>
            <Link href={`/admin/courses?edit=${course.id}`} className="text-xs text-cyan-300">Edit course</Link>
          </div>
        ))}
      </div>
      <CataloguePagination params={params} path="/admin/courses" page={page} total={total} />
    </div>
  );
}
