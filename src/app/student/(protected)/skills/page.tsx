import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSkillProgressState } from "@/lib/progress";
import { LearnOfficialButton } from "@/components/skill-actions";
import { expireStudentAttempts } from "@/lib/assessment";

export default async function StudentSkillsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const params = await searchParams;
  const profile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
    include: { department: true, section: true },
  });

  if (!profile) redirect("/student/login");
  await expireStudentAttempts(profile.id);
  const activeAttempt = await db.assessmentAttempt.findFirst({ where: { studentId: profile.id, submittedAt: null } });

  const levels = await db.skillLevel.findMany({ orderBy: { order: "asc" } });
  const categories = await db.skillCategory.findMany({ orderBy: { name: "asc" } });
  const providers = await db.provider.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  const query = (params.q ?? "").toString().trim().toLowerCase();
  const selectedLevel = (params.level ?? "").toString();
  const selectedCategory = (params.category ?? "").toString();
  const selectedProvider = (params.provider ?? "").toString();
  const selectedPrice = (params.price ?? "").toString();
  const certificateFlag = (params.certificate ?? "").toString();
  const selectedState = (params.state ?? "").toString();

  const skills = await db.skill.findMany({
    where: { active: true },
    include: {
      category: true,
      level: true,
      courses: { include: { provider: true } },
    },
    orderBy: { name: "asc" },
  });

  const stateMap = new Map<string, string>();
  for (const skill of skills) {
    stateMap.set(skill.id, await getSkillProgressState(profile.id, skill.id));
  }

  const filteredSkills = skills.filter((skill) => {
    const course = skill.courses[0];
    const provider = course?.provider?.name ?? "";
    const progressState = stateMap.get(skill.id) ?? "NOT_STARTED";
    const matchesQuery = !query || [skill.name, skill.description ?? "", provider].join(" ").toLowerCase().includes(query);
    const matchesLevel = !selectedLevel || skill.levelId === selectedLevel;
    const matchesCategory = !selectedCategory || skill.categoryId === selectedCategory;
    const matchesProvider = !selectedProvider || course?.providerId === selectedProvider;
    const matchesPrice = !selectedPrice || (selectedPrice === "free" ? Boolean(course?.isFree) : !course?.isFree);
    const matchesCertificate = !certificateFlag || (certificateFlag === "yes" ? Boolean(course?.certificateAvailable) : !course?.certificateAvailable);
    const matchesState = !selectedState || progressState === selectedState;
    return matchesQuery && matchesLevel && matchesCategory && matchesProvider && matchesPrice && matchesCertificate && matchesState;
  });

  return (
    <main className="min-h-screen bg-[#f5f8fc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Student Skills</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">Skill Catalogue</h1>
          </div>
          <Link href="/student/dashboard" className="text-sm font-semibold text-[#1e6fd9]">← Dashboard</Link>
        </div>

        <form method="get" className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-6">
          <input name="q" defaultValue={query} placeholder="Search skill or provider" className="rounded-lg border border-slate-200 px-3 py-2 md:col-span-2" />
          <select name="level" defaultValue={selectedLevel} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <option value="">All levels</option>
            {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
          </select>
          <select name="category" defaultValue={selectedCategory} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select name="provider" defaultValue={selectedProvider} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <option value="">All providers</option>
            {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
          </select>
          <select name="price" defaultValue={selectedPrice} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <option value="">Price</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <select name="certificate" defaultValue={certificateFlag} className="rounded-lg border border-slate-200 bg-white px-3 py-2 md:col-span-2">
            <option value="">Certificate</option>
            <option value="yes">Available</option>
            <option value="no">Not available</option>
          </select>
          <select name="state" defaultValue={selectedState} className="rounded-lg border border-slate-200 bg-white px-3 py-2 md:col-span-2">
            <option value="">All progress</option>
            <option value="NOT_STARTED">Not started</option>
            <option value="LEARNING">Learning</option>
            <option value="LEARNING_COMPLETED">Learning completed</option>
            <option value="ASSESSMENT_AVAILABLE">Assessment available</option>
            <option value="ASSESSMENT_IN_PROGRESS">Assessment in progress</option>
            <option value="REEXAM_REQUIRED">Re-exam required</option>
            <option value="ASSESSMENT_PASSED">Assessment passed</option>
            <option value="CERTIFICATE_UNLOCKED">Certificate unlocked</option>
          </select>
          <button className="rounded-lg bg-[#1e6fd9] px-4 py-2 font-bold text-white md:col-span-2">Apply filters</button>
        </form>

        <div className="grid gap-5 xl:grid-cols-2">
          {filteredSkills.map((skill) => {
            const course = skill.courses[0];
            const provider = course?.provider ?? null;
            const state = stateMap.get(skill.id) ?? "NOT_STARTED";
            const progressLabel = state.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

            return (
              <article key={skill.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">{skill.category.name}</p>
                    <h2 className="mt-2 font-display text-2xl font-bold text-[#10233f]">{skill.name}</h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1e6fd9]">{progressLabel}</span>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p><span className="font-semibold text-slate-700">Course:</span> {course?.name ?? "Official course pending"}</p>
                  <p><span className="font-semibold text-slate-700">Provider:</span> {provider?.name ?? "Pending"}</p>
                  <p><span className="font-semibold text-slate-700">Level:</span> {skill.level.name}</p>
                  <p><span className="font-semibold text-slate-700">Duration:</span> {course?.durationMinutes ?? 60} mins</p>
                  <p><span className="font-semibold text-slate-700">Price:</span> {course?.isFree ? "Free" : "Paid"}</p>
                  <p><span className="font-semibold text-slate-700">Certificate:</span> {course?.certificateAvailable ? "Available" : "Not available"}</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {activeAttempt?.skillId === skill.id && <Link href={`/student/assessment/${activeAttempt.id}`} className="rounded-lg bg-blue-700 p-3 text-white">Resume assessment</Link>}
                  <Link href={`/student/skills/${skill.slug}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">View Details</Link>
                  {course?.officialUrl ? (
                    <LearnOfficialButton skillId={skill.id} courseId={course.id} officialUrl={course.officialUrl} />
                  ) : (
                    <button type="button" disabled className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400" aria-disabled="true">Learn Officially</button>
                  )}

                  {state === "LEARNING" || state === "LEARNING_COMPLETED" || state === "ASSESSMENT_AVAILABLE" || state === "REEXAM_REQUIRED" || state === "ASSESSMENT_FAILED" ? (
                    <form action="/api/student/learning" method="post">
                      <input type="hidden" name="skillId" value={skill.id} />
                      <input type="hidden" name="action" value="complete" />
                      <button className="rounded-lg border border-[#1e6fd9] bg-[#eaf2ff] px-3 py-2 text-sm font-semibold text-[#1e6fd9]">I Completed Learning</button>
                    </form>
                  ) : null}

                  {state === "LEARNING_COMPLETED" || state === "ASSESSMENT_AVAILABLE" || state === "REEXAM_REQUIRED" || state === "ASSESSMENT_FAILED" ? (
                    <form action="/api/student/assessment/start" method="post">
                      <input type="hidden" name="skillId" value={skill.id} />
                      <button className="rounded-lg bg-[#1e6fd9] px-3 py-2 text-sm font-semibold text-white">Start Assessment</button>
                    </form>
                  ) : null}

                  {(state === "ASSESSMENT_PASSED" || state === "CERTIFICATE_UNLOCKED" || state === "PENDING_VERIFICATION" || state === "VERIFIED" || state === "NEEDS_RESUBMISSION" || state === "REJECTED") ? (
                    <Link href="/student/certificates" className="rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Certificate</Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {filteredSkills.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No skills match the current filters.
          </div>
        )}
      </div>
    </main>
  );
}
