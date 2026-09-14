import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordField } from "@/components/password-field";
import { getRoleDashboardPath, getRolePasswordPath, getSession } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { ShieldCheck, AlertCircle } from "lucide-react";

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
      {/* Background glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 shadow-lg shadow-cyan-500/10 group-hover:border-cyan-500/50 transition-colors">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              SkillCert <span className="text-cyan-400">360</span>
            </span>
          </Link>
          <p className="text-sm font-semibold text-slate-300 pt-1">Admin</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 border border-slate-800 shadow-2xl space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form action="/api/auth/admin/login" method="post" className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                name="identifier"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <PasswordField variant="dark" />
            </div>

            <SubmitButton
              pendingText="Signing in..."
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all cursor-pointer"
            >
              Sign In
            </SubmitButton>
          </form>
        </div>
      </div>
    </main>
  );
}
