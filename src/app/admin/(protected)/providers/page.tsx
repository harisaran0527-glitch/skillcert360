import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminProvidersPage() {
  const providers = await db.provider.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">Providers</h1>
        </div>
        <Link href="/admin/dashboard" className="text-sm font-semibold text-[#1e6fd9]">← Dashboard</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-[#10233f]">Add provider</h2>
        <form action="/api/admin/providers" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 md:col-span-1">
            Name
            <input name="name" required className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#1e6fd9]" />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-1">
            Website
            <input name="website" type="url" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#1e6fd9]" />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Description
            <textarea name="description" rows={3} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#1e6fd9]" />
          </label>
          <div className="md:col-span-2">
            <button className="rounded-lg bg-[#1e6fd9] px-5 py-3 font-bold text-white">Save</button>
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold text-[#10233f]">{provider.name}</h3>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${provider.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {provider.active ? "Active" : "Disabled"}
              </span>
            </div>
            {provider.website && <a href={provider.website} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-[#1e6fd9]">Official site</a>}
            {provider.description && <p className="mt-3 text-sm text-slate-500">{provider.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
