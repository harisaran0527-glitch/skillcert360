import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";

export default async function AdminProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (session?.mustChangePassword) redirect("/admin/password");

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/student/dashboard");
  }

  return <div className="min-h-screen bg-[#f5f8fc]"><nav aria-label="Admin navigation" className="flex flex-wrap gap-4 border-b bg-white p-5 text-sm font-semibold text-blue-700">{["dashboard", "students", "skills", "courses", "questions", "assessments", "certificates", "settings", "departments", "providers"].map(path => <Link key={path} href={`/admin/${path}`}>{path[0].toUpperCase() + path.slice(1)}</Link>)}<form action="/api/auth/logout" method="post"><button>Sign out</button></form></nav><div className="mx-auto max-w-7xl p-6">{children}</div></div>;
}
