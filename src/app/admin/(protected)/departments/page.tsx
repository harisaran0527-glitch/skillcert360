import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminDepartmentsPage() {
  const departments = await db.department.findMany({
    orderBy: { name: "asc" },
    include: { sections: true },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">Departments</h1>
        </div>
        <Link href="/admin/dashboard" className="text-sm font-semibold text-[#1e6fd9]">← Dashboard</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-[#10233f]">Add department</h2>
        <form action="/api/admin/departments" method="post" className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="block text-sm font-semibold text-slate-700">
            Department name
            <input name="name" required className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#1e6fd9]" />
          </label>
          <button className="self-end rounded-lg bg-[#1e6fd9] px-5 py-3 font-bold text-white">Save</button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((department) => (
          <div key={department.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold text-[#10233f]">{department.name}</h3>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${department.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {department.active ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{department.sections.length} sections</p>
          </div>
        ))}
      </div>
    </div>
  );
}
