import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSkillProgressState } from "@/lib/progress";
import { deduplicateByNormalizedKey } from "@/lib/academic";
import {
  BookOpen,
  Award,
  FileCheck2,
  RotateCcw,
  Clock,
  Sparkles,
} from "lucide-react";
export default async function StudentMyLearningPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    redirect("/student/login");
  }
  const profile = await db.studentProfile.findUnique({
    where: {
      userId: session.userId,
    },
  });
  if (!profile) {
    redirect("/student/login");
  }
  const rawSkills = await db.studentSkill.findMany({
    where: {
      studentId: profile.id,
    },
    include: {
      selectedCourse: {
        include: {
          provider: true,
        },
      },
      skill: {
        include: {
          category: true,
          level: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });
  const skills = deduplicateByNormalizedKey(
    rawSkills,
    (skill) => skill.skillId
  );
  const enrichedSkills = await Promise.all(
    skills.map(async (item) => {
      const state = await getSkillProgressState(
        profile.id,
        item.skillId
      );
      return {
        id: item.id,
        skillId: item.skillId,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
        skill: item.skill,
        selectedCourse: item.selectedCourse,
        state,
      };
    })
  );
  const currentlyLearning = enrichedSkills.filter(
    (item) => item.state === "LEARNING"
  );
  const readyToUpload = enrichedSkills.filter(
    (item) => item.state === "LEARNING_COMPLETED"
  );
  const pendingVerification = enrichedSkills.filter(
    (item) => item.state === "PENDING_VERIFICATION"
  );
  const needsAttention = enrichedSkills.filter(
    (item) =>
      item.state === "REJECTED" ||
      item.state === "NEEDS_RESUBMISSION"
  );
  const verified = enrichedSkills.filter(
    (item) => item.state === "VERIFIED"
  );
  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Personal Skill Dashboard</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white font-display">
          My Enrolled Learning
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Learn through official courses, upload original certificates to
          SkillLocker, and track verification progress.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="glass-panel rounded-2xl border-l-4 border-l-blue-500 p-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Learning
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-white font-display">
            {currentlyLearning.length}
          </span>
        </div>
        <div className="glass-panel rounded-2xl border-l-4 border-l-cyan-500 p-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Ready to Upload
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-white font-display">
            {readyToUpload.length}
          </span>
        </div>
        <div className="glass-panel rounded-2xl border-l-4 border-l-amber-500 p-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending Verification
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-white font-display">
            {pendingVerification.length}
          </span>
        </div>
        <div className="glass-panel rounded-2xl border-l-4 border-l-rose-500 p-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Needs Attention
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-white font-display">
            {needsAttention.length}
          </span>
        </div>
        <div className="glass-panel rounded-2xl border-l-4 border-l-emerald-500 p-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Verified
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-white font-display">
            {verified.length}
          </span>
        </div>
      </div>
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white font-display">
          <BookOpen className="h-5 w-5 text-blue-400" />
          <span>Currently Learning ({currentlyLearning.length})</span>
        </h2>
        {currentlyLearning.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
            No skills currently in learning phase.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentlyLearning.map((item) => (
              <div
                key={item.id}
                className="glass-panel glass-panel-hover flex flex-col justify-between space-y-4 rounded-2xl p-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                      {item.skill.level.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.skill.category.name}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-white font-display">
                    {item.skill.name}
                  </h3>
                  {item.selectedCourse && (
                    <p className="mt-2 text-xs text-cyan-300">
                      {item.selectedCourse.provider.name} -{" "}
                      {item.selectedCourse.title ??
                        item.selectedCourse.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  <form action="/api/student/learning" method="post">
                    <input
                      type="hidden"
                      name="skillId"
                      value={item.skill.id}
                    />
                    <input
                      type="hidden"
                      name="action"
                      value="complete"
                    />
                    <button className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20">
                      Mark Learning Complete
                    </button>
                  </form>
                  <Link
                    href={`/student/skills/${item.skill.slug}`}
                    className="text-xs font-semibold text-cyan-400 hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white font-display">
          <Award className="h-5 w-5 text-cyan-400" />
          <span>Ready for SkillLocker ({readyToUpload.length})</span>
        </h2>
        {readyToUpload.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
            Complete learning to upload your original provider certificate.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {readyToUpload.map((item) => (
              <div
                key={item.id}
                className="glass-panel glass-panel-hover flex flex-col justify-between space-y-4 rounded-2xl p-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                      {item.skill.level.name}
                    </span>
                    <span className="text-[11px] font-semibold text-cyan-400">
                      Learning Completed
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-white font-display">
                    {item.skill.name}
                  </h3>
                  {item.selectedCourse && (
                    <p className="mt-2 text-xs text-slate-400">
                      {item.selectedCourse.provider.name} -{" "}
                      {item.selectedCourse.title ??
                        item.selectedCourse.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  <Link
                    href="/student/certificates"
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-white"
                  >
                    Upload Certificate
                  </Link>
                  <Link
                    href={`/student/skills/${item.skill.slug}`}
                    className="text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white font-display">
          <Clock className="h-5 w-5 text-amber-400" />
          <span>
            Pending Verification ({pendingVerification.length})
          </span>
        </h2>
        {pendingVerification.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
            No certificates are currently waiting for admin verification.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingVerification.map((item) => (
              <div
                key={item.id}
                className="glass-panel glass-panel-hover rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                    {item.skill.level.name}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-400">
                    Pending Admin Verification
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-white font-display">
                  {item.skill.name}
                </h3>
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <Link
                    href="/student/certificates"
                    className="text-xs font-semibold text-amber-300 hover:underline"
                  >
                    Open SkillLocker
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white font-display">
          <RotateCcw className="h-5 w-5 text-rose-400" />
          <span>Needs Attention ({needsAttention.length})</span>
        </h2>
        {needsAttention.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
            No rejected or resubmission certificates.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {needsAttention.map((item) => (
              <div
                key={item.id}
                className="glass-panel glass-panel-hover rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                    {item.skill.level.name}
                  </span>
                  <span className="text-[11px] font-semibold text-rose-400">
                    {item.state === "REJECTED"
                      ? "Rejected"
                      : "Resubmission Required"}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-white font-display">
                  {item.skill.name}
                </h3>
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <Link
                    href="/student/certificates"
                    className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
                  >
                    Review & Re-upload
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white font-display">
          <FileCheck2 className="h-5 w-5 text-emerald-400" />
          <span>Verified Credentials ({verified.length})</span>
        </h2>
        {verified.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
            No verified certificates yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {verified.map((item) => (
              <div
                key={item.id}
                className="glass-panel glass-panel-hover flex flex-col justify-between space-y-4 rounded-2xl p-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      {item.skill.level.name}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">
                      VERIFIED
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-white font-display">
                    {item.skill.name}
                  </h3>
                </div>
                <div className="border-t border-slate-800 pt-3">
                  <Link
                    href="/student/certificates"
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    View in SkillLocker
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
