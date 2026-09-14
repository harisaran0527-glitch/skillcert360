import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSkillProgressState } from "@/lib/progress";
import { expireStudentAttempts } from "@/lib/assessment";
import { deduplicateByNormalizedKey } from "@/lib/academic";
import {
  BookOpen,
  Award,
  FileCheck2,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default async function StudentMyLearningPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const profile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!profile) redirect("/student/login");

  await expireStudentAttempts(profile.id);

  const rawSkills = await db.studentSkill.findMany({
    where: { studentId: profile.id },
    include: {
      selectedCourse: { include: { provider: true } },
      skill: {
        include: {
          category: true,
          level: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  const skills = deduplicateByNormalizedKey(rawSkills, (s) => s.skillId);

  const [attempts, certificates] = await Promise.all([
    db.assessmentAttempt.findMany({
      where: { studentId: profile.id },
      orderBy: { startedAt: "desc" },
    }),
    db.certificate.findMany({
      where: { studentId: profile.id },
    }),
  ]);

  const latestMap = new Map<string, typeof attempts[number]>();
  for (const attempt of attempts) {
    if (!latestMap.has(attempt.skillId)) latestMap.set(attempt.skillId, attempt);
  }

  const certMap = new Map<string, typeof certificates[number]>();
  for (const cert of certificates) {
    certMap.set(cert.skillId, cert);
  }

  const enrichedSkills = await Promise.all(
    skills.map(async (item) => {
      const state = await getSkillProgressState(profile.id, item.skillId);
      return {
        id: item.id,
        studentId: item.studentId,
        skillId: item.skillId,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
        skill: item.skill,
        selectedCourse: item.selectedCourse,
        state,
        latestAttempt: latestMap.get(item.skillId),
        cert: certMap.get(item.skillId),
      };
    })
  );

  // Group real skills into requested sections:
  const currentlyLearning = enrichedSkills.filter((s) => s.state === "LEARNING" || s.state === "LEARNING_COMPLETED");
  const assessmentReady = enrichedSkills.filter(
    (s) => s.state === "ASSESSMENT_AVAILABLE" || s.state === "ASSESSMENT_IN_PROGRESS"
  );
  const reexamRequired = enrichedSkills.filter((s) => s.state === "REEXAM_REQUIRED");
  const completed = enrichedSkills.filter(
    (s) => s.state === "ASSESSMENT_PASSED" || s.state === "CERTIFICATE_UNLOCKED" || s.state === "PENDING_VERIFICATION" || s.state === "NEEDS_RESUBMISSION" || s.state === "REJECTED"
  );
  const verified = enrichedSkills.filter((s) => s.state === "VERIFIED");

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Personal Skill Dashboard</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white font-display">My Enrolled Learning</h1>
        <p className="text-xs text-slate-400 mt-1">
          Track active courses, prepare for assessments, and review completed skill credentials.
        </p>
      </div>

      {/* Summary Counts Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-blue-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Learning</span>
          <span className="text-2xl font-extrabold text-white font-display mt-1 block">{currentlyLearning.length}</span>
        </div>
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-cyan-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Assessment Ready</span>
          <span className="text-2xl font-extrabold text-white font-display mt-1 block">{assessmentReady.length}</span>
        </div>
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-amber-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Re-exam Pending</span>
          <span className="text-2xl font-extrabold text-white font-display mt-1 block">{reexamRequired.length}</span>
        </div>
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-indigo-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Completed</span>
          <span className="text-2xl font-extrabold text-white font-display mt-1 block">{completed.length}</span>
        </div>
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Verified</span>
          <span className="text-2xl font-extrabold text-white font-display mt-1 block">{verified.length}</span>
        </div>
      </div>

      {/* Section 1: Currently Learning */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
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
              <div key={item.id} className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                      {item.skill.level.name}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.skill.category.name}</span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-white font-display">{item.skill.name}</h3>
                  {item.selectedCourse && <p className="mt-2 text-xs text-cyan-300">{item.selectedCourse.provider.name} · {item.selectedCourse.title ?? item.selectedCourse.name}</p>}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  {item.completedAt ? <Link href={`/student/certificate-request/${item.skillId}`} className="text-xs font-semibold text-cyan-300">Learning Completed · Open Request Form</Link> : <form action="/api/student/learning" method="post">
                    <input type="hidden" name="skillId" value={item.skill.id} />
                    <input type="hidden" name="action" value="complete" />
                    <button className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all">
                      Mark Learning Complete
                    </button>
                  </form>}
                  <Link href={`/student/skills/${item.skill.slug}`} className="text-xs font-semibold text-cyan-400 hover:underline">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Assessment Ready */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Award className="h-5 w-5 text-cyan-400" />
          <span>Assessment Ready ({assessmentReady.length})</span>
        </h2>
        {assessmentReady.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
            No assessments ready for immediate attempt. Complete course learning to qualify.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assessmentReady.map((item) => (
              <div key={item.id} className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                      {item.skill.level.name}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400">Ready</span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-white font-display">{item.skill.name}</h3>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  {item.latestAttempt?.submittedAt === null ? (
                    <Link
                      href={`/student/assessment/${item.latestAttempt.id}`}
                      className="rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30"
                    >
                      Resume Exam
                    </Link>
                  ) : (
                    <Link href={`/student/certificate-request/${item.skillId}`} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-white">Continue to Assessment</Link>
                  )}
                  <Link href={`/student/skills/${item.skill.slug}`} className="text-xs font-semibold text-slate-400 hover:text-white">
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Re-exam Required */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-amber-400" />
          <span>Re-exam Required ({reexamRequired.length})</span>
        </h2>
        {reexamRequired.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
            No re-exams currently pending.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reexamRequired.map((item) => (
              <div key={item.id} className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                      {item.skill.level.name}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-400">Assessment Failed · Certificate Locked</span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-white font-display">{item.skill.name}</h3>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <Link href={`/student/certificate-request/${item.skillId}`} className="rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 text-xs font-bold text-amber-300">Re-attempt Assessment</Link>
                  <Link href={`/student/skills/${item.skill.slug}`} className="text-xs font-semibold text-slate-400 hover:text-white">
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 4: Completed & Verified */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-emerald-400" />
          <span>Completed & Verified Credentials ({completed.length + verified.length})</span>
        </h2>
        {completed.length + verified.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
            No completed certificates yet. Pass assessments to unlock certificates.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...completed, ...verified].map((item) => (
              <div key={item.id} className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      {item.skill.level.name}
                    </span>
                    <span className={`text-[11px] font-bold ${item.state === "VERIFIED" ? "text-emerald-400" : "text-cyan-400"}`}>
                      {item.state}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-white font-display">{item.skill.name}</h3>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <Link
                    href="/student/certificates"
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    View Certificate
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
