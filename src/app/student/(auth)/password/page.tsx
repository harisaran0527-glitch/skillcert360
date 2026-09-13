import { redirect } from "next/navigation";
import { getRoleDashboardPath, getSession } from "@/lib/auth";
import { Lock, KeyRound, ArrowRight, AlertCircle } from "lucide-react";

export default async function StudentPassword({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();

  if (!session) {
    redirect("/student/login");
  }

  if (session.role !== "STUDENT") {
    redirect("/admin/dashboard");
  }

  if (!session.mustChangePassword) {
    redirect(getRoleDashboardPath("STUDENT"));
  }

  const { error } = await searchParams;

  return (
    <main className="relative min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-12 overflow-hidden selection:bg-cyan-500 selection:text-white">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="glass-panel p-8 sm:p-10 border border-slate-800 shadow-2xl">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 uppercase tracking-widest">
              <KeyRound className="w-3.5 h-3.5" /> Initial Account Setup
            </div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight sm:text-3xl">
              Set Your Password
            </h1>
            <p className="text-xs text-slate-400">
              Your temporary password has verified your account. Please create a permanent private password.
            </p>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form action="/api/account/password" method="post" className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                New Account Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98]"
            >
              Continue to Student Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}