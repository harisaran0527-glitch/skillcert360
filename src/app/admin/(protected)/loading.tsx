import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="space-y-8 pb-12 animate-pulse">
      {/* Top Loading Indicator */}
      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
        <Loader2 className="h-4 w-4 animate-spin shrink-0 text-indigo-400" />
        <span>Loading...</span>
      </div>

      {/* Admin Command Center Header Skeleton */}
      <div className="rounded-3xl border border-indigo-500/20 bg-slate-900/60 p-8 space-y-4">
        <div className="h-4 w-44 rounded-full bg-indigo-500/20" />
        <div className="h-9 w-72 rounded-xl bg-slate-800" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-slate-800/60" />
      </div>

      {/* Admin KPI Cards Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 rounded bg-slate-800" />
              <div className="h-4 w-4 rounded bg-indigo-400/20" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Admin Metrics Breakdown Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-5">
            <div className="h-6 w-48 rounded-lg bg-slate-800" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 rounded-2xl bg-slate-800/50" />
              <div className="h-16 rounded-2xl bg-slate-800/50" />
              <div className="h-16 rounded-2xl bg-slate-800/50" />
            </div>
            <div className="h-3 w-full rounded-full bg-slate-800/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
