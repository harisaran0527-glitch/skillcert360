import { LearnOfficialButton } from "@/components/skill-actions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSkillProgressState } from "@/lib/progress";

export default async function StudentSkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const { slug } = await params;
  const skill = await db.skill.findFirst({
    where: { slug, active: true },
    include: {
      category: true,
      level: true,
      prerequisites: { include: { prerequisite: true } },
      courses: { include: { provider: true } },
      certificates: { include: { student: true } },
    },
  });

  if (!skill) notFound();

  const profile = await db.studentProfile.findUnique({ where: { userId: session.userId }, include: { department: true, section: true } });
  if (!profile) redirect("/student/login");

  const state = await getSkillProgressState(profile.id, skill.id);
  const firstCourse = skill.courses[0];

  return (
    <main className="min-h-screen bg-[#f5f8fc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/student/skills" className="text-sm font-semibold text-[#1e6fd9]">← Back to Skills</Link>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">{skill.category.name}</p>
              <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">{skill.name}</h1>
              <p className="mt-4 max-w-3xl text-slate-600">{skill.description || "This skill is being curated by the admin team and will include detailed learning guidance as course content is added."}</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[#1e6fd9]">{state}</span>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Official course</p><p className="mt-2 font-semibold text-[#10233f]">{firstCourse?.name ?? "Pending"}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Provider</p><p className="mt-2 font-semibold text-[#10233f]">{firstCourse?.provider.name ?? "Pending"}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Level</p><p className="mt-2 font-semibold text-[#10233f]">{skill.level.name}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Certificate</p><p className="mt-2 font-semibold text-[#10233f]">{firstCourse?.certificateAvailable ? "Available" : "Not available"}</p></div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="font-display text-2xl font-bold text-[#10233f]">Learning outcomes</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">
                  <li>Understand the official core concepts and frameworks tied to the provider course.</li>
                  <li>Apply practical problem solving within the skill domain.</li>
                  <li>Demonstrate readiness through a secure internal assessment.</li>
                  <li>Submit an authentic certificate for verification after assessment pass.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="font-display text-2xl font-bold text-[#10233f]">Prerequisites</h2>
                <p className="mt-4 text-slate-600">
                  {skill.prerequisites.length > 0 ? skill.prerequisites.map((item) => item.prerequisite.name).join(", ") : "No formal prerequisites are required for this skill."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="font-display text-2xl font-bold text-[#10233f]">Progress timeline</h2>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-white p-3">Status: <span className="font-semibold text-[#10233f]">{state}</span></div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">Department: {profile.department.name}</div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">Section: {profile.section.name}</div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">Official URL: {firstCourse?.officialUrl ? "Available" : "Pending"}</div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {firstCourse?.officialUrl && (
                  <LearnOfficialButton skillId={skill.id} courseId={firstCourse.id} officialUrl={firstCourse.officialUrl} />
                )}
                <Link href="/student/skills" className="text-blue-700">Learning and assessment actions</Link>
                <Link href="/student/certificates" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Certificate</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
