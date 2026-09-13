import { productionSkillWhere, productionNameWhere, productionCourseWhere } from "@/lib/production-ui";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { cataloguePage, param, type CatalogueParams } from "@/lib/catalog";
import { ActiveField, CatalogueFilters, CataloguePagination, catalogueInput } from "@/components/catalog-admin-controls";
import { db } from "@/lib/db";
import { Building, Plus, ExternalLink } from "lucide-react";

export default async function AdminProvidersPage({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  const params = await searchParams;
  const where: Prisma.ProviderWhereInput = {
    AND: [productionNameWhere],
    ...(param(params, "q") ? { OR: [{ name: { contains: param(params, "q"), mode: "insensitive" as const } }, { slug: { contains: param(params, "q"), mode: "insensitive" as const } }] } : {}),
    ...(["true", "false"].includes(param(params, "active")) ? { active: param(params, "active") === "true" } : {}),
  };
  const total = await db.provider.count({ where });
  const page = Math.min(cataloguePage(param(params, "page")), Math.max(1, Math.ceil(total / 24)));
  const editing = param(params, "edit") ? await db.provider.findUnique({ where: { id: param(params, "edit") } }) : null;
  const providers = await db.provider.findMany({ where, include: { _count: { select: { courses: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * 24, take: 24 });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
            <Building className="h-3.5 w-3.5" />
            <span>Course Provider Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Provider Organizations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage external education platforms (e.g. Coursera, edX, NPTEL, AWS, Microsoft).
          </p>
        </div>
        <span className="text-xs font-mono text-indigo-400 font-bold bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          {total} Providers
        </span>
      </div>

      <CatalogueFilters params={params} path="/admin/providers" />
      {/* Add Provider Form */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-display">{editing ? "Edit Provider" : "Register New Provider"}</h2>
            <p className="text-[11px] text-slate-400">Add course provider metadata.</p>
          </div>
        </div>

        <form key={editing?.id ?? "new"} action="/api/admin/providers" method="post" className="grid gap-4 text-xs md:grid-cols-2">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <label>Slug<input name="slug" required defaultValue={editing?.slug ?? ""} placeholder="e.g. microsoft" className={catalogueInput} /></label>
          <ActiveField active={editing?.active} />
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Provider Name</label>
            <input
              name="name"
              defaultValue={editing?.name}
              required
              placeholder="e.g. NPTEL / SWAYAM"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Official Website URL</label>
            <input
              name="website"
              defaultValue={editing?.officialWebsite ?? editing?.website ?? ""}
              type="url"
              placeholder="https://nptel.ac.in"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="font-semibold text-slate-300 block">Description</label>
            <textarea
              name="description"
              defaultValue={editing?.description ?? ""}
              rows={3}
              placeholder="Overview of official certificate offerings..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Save Provider Record</span>
            </button>
          </div>
        </form>
      </div>

      {/* Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((prov) => (
          <div key={prov.id} className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white font-display">{prov.name}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  prov.active ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                }`}>
                  {prov.active ? "Active" : "Disabled"}
                </span>
              </div>
              {prov.description && <p className="mt-2 text-xs text-slate-400">{prov.description}</p>}
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              {(prov.officialWebsite || prov.website) ? (
                <a href={prov.officialWebsite || prov.website || ""} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:underline">
                  <span>Official Site</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-slate-500">No website configured</span>
              )}
            </div>
            <p className="text-xs text-slate-400">Slug: {prov.slug}</p>
            <div className="flex gap-4 text-xs text-cyan-300"><Link href={`/admin/providers?edit=${prov.id}`}>Edit provider</Link><Link href={`/admin/courses?provider=${prov.id}`}>{prov._count.courses} courses</Link></div>
          </div>
        ))}
      </div>
      <CataloguePagination params={params} path="/admin/providers" page={page} total={total} />
    </div>
  );
}
