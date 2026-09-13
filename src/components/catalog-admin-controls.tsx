import Link from "next/link";
import { param, type CatalogueParams } from "@/lib/catalog";
export const catalogueInput = "w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-white";
export function CatalogueFilters({ params, path, filters = [] }: { params: CatalogueParams; path: string; filters?: { name: string; label: string; options: { id: string; name: string }[] }[] }) {
  return <>
    {param(params, "error") && <p role="alert" className="rounded-xl border border-rose-500 p-4 text-sm text-rose-300">{param(params, "error")}</p>}
    {param(params, "saved") && <p role="status" className="text-sm text-emerald-300">Changes saved.</p>}
    <form action={path} className="glass-panel rounded-2xl p-4 grid gap-3 md:grid-cols-4">
      <input className={catalogueInput} name="q" aria-label="Search catalogue" placeholder="Search catalogue" defaultValue={param(params, "q")} />
      {filters.map(filter => <select className={catalogueInput} key={filter.name} name={filter.name} aria-label={filter.label} defaultValue={param(params, filter.name)}><option value="">All {filter.label}</option>{filter.options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select>)}
      <select className={catalogueInput} name="active" aria-label="Active status" defaultValue={param(params, "active")}><option value="">Active and inactive</option><option value="true">Active</option><option value="false">Inactive</option></select>
      <button className={catalogueInput}>Apply Filters</button><Link href={path} className="text-xs text-cyan-300">Clear Filters</Link>
    </form>
  </>;
}
export function CataloguePagination({ params, path, page, total, pageSize = 24 }: { params: CatalogueParams; path: string; page: number; total: number; pageSize?: number }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (next: number) => {
    const query = new URLSearchParams();
    for (const key of Object.keys(params)) if (!["edit", "saved", "error", "page"].includes(key)) query.set(key, param(params, key));
    query.set("page", String(next));
    return path + "?" + query;
  };
  return <nav aria-label="Catalogue pagination" className="flex gap-5 items-center text-xs text-slate-300"><span>{total} results · Page {page} of {pages}</span>{page > 1 && <Link href={href(page - 1)}>Previous</Link>}{page < pages && <Link href={href(page + 1)}>Next</Link>}</nav>;
}
export function ActiveField({ active = true }: { active?: boolean }) {
  return <label className="text-xs text-slate-300">Active status<select name="active" defaultValue={String(active)} className={catalogueInput}><option value="true">Active</option><option value="false">Inactive</option></select></label>;
}
