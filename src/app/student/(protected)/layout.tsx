import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function StudentProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (session?.mustChangePassword) redirect("/student/password");

  if (!session) {
    redirect("/student/login");
  }

  if (session.role !== "STUDENT") {
    redirect("/admin/dashboard");
  }

  return <div className="min-h-screen bg-[#f5f8fc]">{children}</div>;
}
