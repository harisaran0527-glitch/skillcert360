import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { StudentNavigation } from "@/components/student-navigation";

export default async function StudentProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (session?.mustChangePassword) redirect("/student/password");

  if (!session) {
    redirect("/student/login");
  }

  if (session.role !== "STUDENT") {
    redirect("/admin/dashboard");
  }

  const profile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
    select: { fullName: true, registerNumber: true },
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans antialiased">
      <StudentNavigation
        studentName={profile?.fullName || "Student"}
        registerNumber={profile?.registerNumber || ""}
      />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
