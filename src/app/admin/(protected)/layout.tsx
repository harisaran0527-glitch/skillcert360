import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNavigation } from "@/components/admin-navigation";

export default async function AdminProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (session?.mustChangePassword) redirect("/admin/password");

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/student/dashboard");
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 font-sans antialiased">
      <AdminNavigation adminEmail={user?.email || "admin@skillcert.com"} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
