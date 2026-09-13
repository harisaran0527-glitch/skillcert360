import Link from "next/link";
import { db } from "@/lib/db";
import { Building2, Plus, Layers } from "lucide-react";

export default async function AdminDepartmentsPage() {
  const departments = await db.department.findMany({
    orderBy: { name: "asc" },
    include: { sections: true },
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 mb-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>Academic Department Hierarchy</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">College Departments & Sections</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure academic departments and sections for student classification.
          </p>
        </div>
        <span className="text-xs font-mono text-indigo-400 font-bold bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
          {departments.length} Departments
        </span>
      </div>

      {/* Add Form */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-display">Create Academic Department</h2>
            <p className="text-[11px] text-slate-400">Add a new department entity.</p>
          </div>
        </div>

        <form action="/api/admin/departments" method="post" className="grid gap-4 text-xs md:grid-cols-[1fr_auto]">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 block">Department Name</label>
            <input
              name="name"
              required
              placeholder="e.g. Computer Science & Engineering"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Save Department</span>
            </button>
          </div>
        </form>
      </div>

      {/* Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((dept) => (
          <div key={dept.id} className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-white font-display">{dept.name}</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                dept.active ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
              }`}>
                {dept.active ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>{dept.sections.length} Sections Defined</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
