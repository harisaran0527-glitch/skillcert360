import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordField } from "@/components/password-field";
import { getRoleDashboardPath, getRolePasswordPath, getSession } from "@/lib/auth";

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
    <main className="min-h-screen bg-[#071a32] px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="font-display text-xl font-bold text-white">SkillCert <span className="text-[#35c3d9]">360</span></Link>
        <div className="mt-16 rounded-2xl border border-white/10 bg-[#102b4d] p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#35c3d9]">Administration</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-white">Control center</h1>
          <p className="mt-2 text-sm text-blue-100/60">Authorized staff only.</p>
          {error && <p className="mt-5 rounded-lg bg-red-900/50 px-4 py-3 text-sm text-red-100">{error}</p>}
          <form action="/api/auth/admin/login" method="post" className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-blue-100">
              Admin email
              <input name="identifier" type="email" required className="mt-2 w-full rounded-lg border border-white/10 bg-[#0c2140] px-4 py-3 text-white outline-none focus:border-[#35c3d9]" />
            </label>
            <label className="block text-sm font-semibold text-blue-100">
              Password
              <PasswordField variant="dark" />
            </label>
            <button className="w-full rounded-lg bg-[#35c3d9] py-3.5 font-bold text-[#0c2140] transition hover:bg-white">Sign in</button>
          </form>
          <Link href="/student/login" className="mt-6 block text-center text-sm text-blue-100/60 hover:text-white">Student portal</Link>
        </div>
      </div>
    </main>
  );
}
