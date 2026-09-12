import { redirect } from "next/navigation";
import { getRoleDashboardPath, getSession } from "@/lib/auth";

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
    <main className="min-h-screen bg-[#0c2140] px-6 py-12">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">First login</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-[#10233f]">Set your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Your temporary password has done its job. Choose a private password before continuing.</p>
        {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <form action="/api/account/password" method="post" className="mt-7 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            New password
            <input name="password" type="password" minLength={8} required className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#1e6fd9]" />
          </label>
          <button className="w-full rounded-lg bg-[#1e6fd9] py-3.5 font-bold text-white">Continue to dashboard</button>
        </form>
      </div>
    </main>
  );
}