import { redirect } from "next/navigation";
import { getRoleDashboardPath, getSession } from "@/lib/auth";

export default async function AdminPassword({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/student/dashboard");
  }

  if (!session.mustChangePassword) {
    redirect(getRoleDashboardPath("ADMIN"));
  }

  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#071a32] px-6 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#102b4d] p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#35c3d9]">First login</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white">Set your password</h1>
        <p className="mt-2 text-sm leading-6 text-blue-100/70">Choose a private password to activate this administrator account.</p>
        {error && <p className="mt-5 rounded-lg bg-red-900/50 px-4 py-3 text-sm text-red-100">{error}</p>}
        <form action="/api/account/password" method="post" className="mt-7 space-y-5">
          <label className="block text-sm font-semibold text-blue-100">
            New password
            <input name="password" type="password" minLength={8} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#0c2140] px-4 py-3 text-white outline-none focus:border-[#35c3d9]" />
          </label>
          <button className="w-full rounded-lg bg-[#35c3d9] py-3.5 font-bold text-[#0c2140]">Continue to dashboard</button>
        </form>
      </div>
    </main>
  );
}