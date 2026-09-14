import { Loader2 } from "lucide-react";

export default function StudentLoading() {
  return (
    <div className="space-y-8 pb-12 animate-pulse">
      {/* Top Loading Indicator */}
      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
        <Loader2 className="h-4 w-4 animate-spin shrink-0 text-cyan-400" />
        <span>Loading...</span>
      </div>

      {/* Header Banner Skeleton */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 space-y-4">
        <div className="h-4 w-36 rounded-full bg-cyan-500/20" />
        <div className="h-8 w-64 rounded-xl bg-slate-800/80" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-slate-800/50" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-24 rounded-lg bg-slate-800/80" />
          <div className="h-6 w-24 rounded-lg bg-slate-800/80" />
          <div className="h-6 w-24 rounded-lg bg-slate-800/80" />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 rounded bg-slate-800" />
              <div className="h-8 w-8 rounded-xl bg-cyan-500/10" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Main Section Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 rounded-lg bg-slate-800" />
          <div className="h-4 w-20 rounded bg-slate-800/60" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 rounded-md bg-cyan-500/20" />
                <div className="h-3 w-16 rounded bg-slate-800" />
              </div>
              <div className="h-6 w-3/4 rounded-lg bg-slate-800" />
              <div className="h-3 w-full rounded bg-slate-800/50" />
              <div className="pt-3 border-t border-slate-800/60 flex justify-between">
                <div className="h-4 w-24 rounded bg-slate-800" />
                <div className="h-4 w-16 rounded bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
