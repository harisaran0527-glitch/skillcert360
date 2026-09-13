import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordField } from "@/components/password-field";
import { getRoleDashboardPath, getRolePasswordPath, getSession } from "@/lib/auth";
import { ShieldCheck, ArrowRight, GraduationCap, AlertCircle, Lock } from "lucide-react";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();

  if (session) {
    if (session.role === "ADMIN") {
      redirect(session.mustChangePassword ? getRolePasswordPath("ADMIN") : getRoleDashboardPath("ADMIN"));
    }

    if (session.role === "STUDENT") {
      redirect(session.mustChangePassword ? getRolePasswordPath("STUDENT") : getRoleDashboardPath("STUDENT"));
    }
  }

  const { error } = await searchParams;

  return (
    <main className="relative min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-12 overflow-hidden selection:bg-cyan-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 shadow-lg shadow-cyan-500/10 group-hover:border-cyan-500/50 transition-colors">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight text-white">
              SkillCert <span className="text-cyan-400">360</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 sm:p-10 border border-slate-800 shadow-2xl relative">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 uppercase tracking-widest">
              <Lock className="w-3.5 h-3.5" /> Administration Control Center
            </div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight sm:text-3xl">
              Staff Portal Sign In
            </h1>
            <p className="text-xs text-slate-400">
              Restricted area for authorized platform administrators only.
            </p>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form action="/api/auth/admin/login" method="post" className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email Address
              </label>
              <input
                name="identifier"
                type="email"
                required
                placeholder="admin@skillcert.com"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Security Password
              </label>
              <PasswordField variant="dark" />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98]"
            >
              Access Control Panel <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 border-t border-slate-800/80 pt-6 text-center">
            <Link
              href="/student/login"
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Return to Student Portal Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
