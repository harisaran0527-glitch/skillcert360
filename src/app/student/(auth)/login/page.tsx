import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordField } from "@/components/password-field";
import { getRoleDashboardPath, getRolePasswordPath, getSession } from "@/lib/auth";

export default async function StudentLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();

  if (session) {
    if (session.role === "STUDENT") {
      redirect(session.mustChangePassword ? getRolePasswordPath("STUDENT") : getRoleDashboardPath("STUDENT"));
    }

    if (session.role === "ADMIN") {
      redirect(session.mustChangePassword ? getRolePasswordPath("ADMIN") : getRoleDashboardPath("ADMIN"));
    }
  }

  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#0c2140] px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="font-display text-xl font-bold text-white">SkillCert <span className="text-[#35c3d9]">360</span></Link>
        <div className="mt-16 rounded-2xl bg-white p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Student portal</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-[#10233f]">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Use your email or register number.</p>
          {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <form action="/api/auth/student/login" method="post" className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              Email or register number
              <input name="identifier" required className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#1e6fd9]" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Password
              <PasswordField variant="light" />
            </label>
            <button className="w-full rounded-lg bg-[#1e6fd9] py-3.5 font-bold text-white transition hover:bg-[#0c58bb]">Sign in</button>
          </form>
          <Link href="/admin/login" className="mt-6 block text-center text-sm text-slate-500 hover:text-[#1e6fd9]">Admin portal</Link>
        </div>
      </div>
    </main>
  );
}
