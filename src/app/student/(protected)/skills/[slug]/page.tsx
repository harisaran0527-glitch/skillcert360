import { productionSkillWhere, productionCourseWhere } from "@/lib/production-ui";
import Link from "next/link";
import { skillLevelColor } from "@/lib/catalog";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSkillProgressState } from "@/lib/progress";
import { getStudentProgression, UNLOCK_THRESHOLDS, GATING_LEVEL, LEVEL_NAMES, type LevelName } from "@/lib/progression";
import { deduplicateByNormalizedKey } from "@/lib/academic";
import { LearnOfficialButton } from "@/components/skill-actions";
import { SubmitButton } from "@/components/submit-button";
import {
  ArrowLeft,
  BookOpen,
  Award,
  Lock,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  BadgeCheck,
  Users,
  Globe,
  Star,
  AlertTriangle,
  Layers,
} from "lucide-react";

const credTypeLabel = (type: string) => {
  switch (type) {
    case "COMPLETION_CERTIFICATE": return "Completion Certificate";
    case "DIGITAL_BADGE": return "Digital Badge";
    case "ACHIEVEMENT": return "Achievement";
    case "APPLIED_SKILL": return "Applied Skill";
    case "MICROCREDENTIAL": return "Microcredential";
    case "PROFESSIONAL_CERTIFICATION": return "Professional Certification";
    default: return null;
  }
};

const credTypeColor = (type: string) => {
  switch (type) {
    case "COMPLETION_CERTIFICATE": return "border-blue-500/40 bg-blue-500/10 text-blue-300";
    case "DIGITAL_BADGE": return "border-purple-500/40 bg-purple-500/10 text-purple-300";
    case "ACHIEVEMENT": return "border-cyan-500/40 bg-cyan-500/10 text-cyan-300";
    case "APPLIED_SKILL": return "border-teal-500/40 bg-teal-500/10 text-teal-300";
    case "MICROCREDENTIAL": return "border-indigo-500/40 bg-indigo-500/10 text-indigo-300";
    case "PROFESSIONAL_CERTIFICATION": return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    default: return "border-slate-700 bg-slate-800 text-slate-400";
  }
};

const pricingLabel = (type: string) => {
  switch (type) {
    case "FREE": return "Free";
    case "FREE_LEARNING_PAID_EXAM": return "Free Learning · Paid Exam";
    case "PAID": return "Paid";
    case "SUBSCRIPTION": return "Subscription";
    default: return "Unknown";
  }
};

const pricingColor = (type: string) => {
  switch (type) {
    case "FREE": return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    case "FREE_LEARNING_PAID_EXAM": return "text-yellow-300 border-yellow-500/40 bg-yellow-500/10";
    case "PAID": return "text-rose-400 border-rose-500/40 bg-rose-500/10";
    case "SUBSCRIPTION": return "text-indigo-300 border-indigo-500/40 bg-indigo-500/10";
    default: return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
  }
};

const urlStatusBadge = (status: string) => {
  switch (status) {
    case "VERIFIED": return { label: "Verified Link", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" };
    case "RETIRED": return { label: "Link Retired", color: "text-rose-400 border-rose-500/40 bg-rose-500/10" };
    case "UNAVAILABLE": return { label: "Unavailable", color: "text-rose-400 border-rose-500/40 bg-rose-500/10" };
    default: return { label: "Link Pending Verification", color: "text-yellow-300 border-yellow-500/40 bg-yellow-500/10" };
  }
};

export default async function StudentSkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const { slug } = await params;
  const skill = await db.skill.findFirst({
    where: { AND: [productionSkillWhere], slug, active: true, category: { active: true }, level: { active: true } },
    include: {
      category: true,
      level: true,
      prerequisites: { include: { prerequisite: true } },
      courses: {
        where: { AND: [productionCourseWhere], active: true, provider: { active: true } },
        include: { provider: true, level: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!skill) notFound();

  const profile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
    include: { department: true, section: true },
  });
  if (!profile) redirect("/student/login");

  const [state, progression] = await Promise.all([
    getSkillProgressState(profile.id, skill.id),
    getStudentProgression(profile.id),
  ]);

  // Get student's selected course for this skill
  const studentSkill = await db.studentSkill.findUnique({
    where: { studentId_skillId: { studentId: profile.id, skillId: skill.id } },
    include: { selectedCourse: { include: { provider: true } } },
  });

  const skillLevelName = skill.level.name;
  const isCanonical = LEVEL_NAMES.includes(skillLevelName as LevelName);
  const levelEntry = isCanonical
    ? progression.levels.find((l) => l.name === skillLevelName)
    : null;
  const isLocked = levelEntry ? !levelEntry.unlocked : false;
  const gating = isLocked ? GATING_LEVEL[skillLevelName as LevelName] : null;
  const threshold = isLocked ? UNLOCK_THRESHOLDS[skillLevelName as LevelName] : 0;
  const gatingCount = gating
    ? (progression.levels.find((l) => l.name === gating)?.verifiedCount ?? 0)
    : 0;
  const remainingCount = Math.max(0, threshold - gatingCount);

  const levelColor = skillLevelColor(skillLevelName);

  const courses = deduplicateByNormalizedKey([...skill.courses].sort((a, b) => Number(b.id === studentSkill?.selectedCourseId) - Number(a.id === studentSkill?.selectedCourseId)), (c) => `${c.providerId}:${c.name}`);
  const totalProviders = new Set(courses.map((c) => c.providerId)).size;
  const credentialCourses = courses.filter((c) => c.credentialAvailable);

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Back Nav */}
      <div>
        <Link
          href="/student/skills"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Skills Catalogue
        </Link>
      </div>

      {/* Skill Header */}
      <div className="glass-panel rounded-2xl p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                {skill.category.name}
              </span>
              <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${isLocked ? "border-amber-500/40 bg-amber-500/15 text-amber-300" : levelColor}`}>
                {isLocked && <Lock className="h-3 w-3 inline mr-1" />}
                {skillLevelName}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              {skill.name}
              {isLocked && " 🔒"}
            </h1>
            {skill.description && (
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">{skill.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 shrink-0">
            <div className="flex flex-col items-center glass-panel rounded-xl px-4 py-3 text-center">
              <Users className="h-5 w-5 text-cyan-400 mb-1" />
              <span className="text-xl font-extrabold text-white">{totalProviders}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Providers</span>
            </div>
            <div className="flex flex-col items-center glass-panel rounded-xl px-4 py-3 text-center">
              <BookOpen className="h-5 w-5 text-blue-400 mb-1" />
              <span className="text-xl font-extrabold text-white">{courses.length}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Courses</span>
            </div>
            <div className="flex flex-col items-center glass-panel rounded-xl px-4 py-3 text-center">
              <BadgeCheck className="h-5 w-5 text-emerald-400 mb-1" />
              <span className="text-xl font-extrabold text-white">{credentialCourses.length}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Credentials</span>
            </div>
          </div>
        </div>

        {/* Lock Banner */}
        {isLocked && gating && (
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 mb-2">
              <Lock className="h-4 w-4" />
              <span>{skillLevelName} Level — Locked</span>
            </div>
            <p className="text-sm text-slate-300">
              You need to verify{" "}
              <strong className="text-amber-200">{remainingCount} more {gating} credentials</strong>{" "}
              to unlock {skillLevelName} level skills.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                  style={{ width: `${Math.min(100, (gatingCount / threshold) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-amber-400 shrink-0">{gatingCount}/{threshold}</span>
            </div>
            <Link
              href="/student/skills"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Browse {gating} skills
            </Link>
          </div>
        )}

        {/* Learning Progress Status (for unlocked students) */}
        {!isLocked && state !== "NOT_STARTED" && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span>
                Your Progress:{" "}
                <span className="font-extrabold text-white">
                  {state === "LEARNING" ? "Learning in Progress" :
                   state === "LEARNING_COMPLETED" ? "Learning Completed · Ready to Upload Certificate" :
                   state === "PENDING_VERIFICATION" ? "Certificate Pending Verification" :



                   state === "REJECTED" ? "Certificate Rejected" : state === "NEEDS_RESUBMISSION" ? "Resubmission Required" :
                   state === "VERIFIED" ? "Verified ✓" : state}
                </span>
              </span>
            </div>
            {studentSkill?.selectedCourse && (
              <div className="text-xs text-slate-400">
                Enrolled in:{" "}
                <span className="text-white font-semibold">{studentSkill.selectedCourse.provider?.name}</span>
                {" — "}
                <span className="text-slate-300">{studentSkill.selectedCourse.name}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Choose Your Official Provider */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              {isLocked ? "Available Official Learning Options" : "Choose Your Official Learning Provider"}
            </h2>
          </div>
          {!isLocked && courses.length > 1 && (
            <span className="text-xs text-slate-400">
              {courses.length} options from {totalProviders} official provider{totalProviders !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center space-y-2">
            <BookOpen className="h-8 w-8 text-slate-500 mx-auto" />
            <p className="text-sm text-white font-semibold">No official courses found yet.</p>
            <p className="text-xs text-slate-400">Official course links for this skill are being verified.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => {
              const urlBadge = urlStatusBadge(course.officialUrlStatus ?? "OFFICIAL_LINK_PENDING");
              const ctLabel = credTypeLabel(course.credentialType ?? "NONE");
              const ctColor = credTypeColor(course.credentialType ?? "NONE");
              const isSelected = studentSkill?.selectedCourseId === course.id;

              return (
                <div
                  key={course.id}
                  className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${
                    isSelected
                      ? "border-cyan-500/60 shadow-lg shadow-cyan-500/10"
                      : isLocked
                      ? "opacity-80"
                      : "glass-panel-hover"
                  }`}
                >
                  {/* Provider & Title Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Official Provider
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/60 bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                            <CheckCircle2 className="h-3 w-3" /> Your Selected Course
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-extrabold text-cyan-300">
                          {course.provider?.name ?? "Official Provider"}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">
                        {course.title ?? course.name}
                      </h3>
                      {course.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">{course.description}</p>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col gap-1.5 items-start sm:items-end shrink-0">
                      <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${pricingColor(course.pricingType ?? "FREE")}`}>
                        {pricingLabel(course.pricingType ?? "FREE")}
                      </span>
                      <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${urlBadge.color}`}>
                        {urlBadge.label}
                      </span>
                      <span className="text-xs text-slate-300">{course.level.name}</span>
                      {(
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          {course.duration || (course.durationMinutes ? `${course.durationMinutes} minutes` : "Duration not specified")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Credential Info */}
                  <div className="border-t border-slate-800/60 pt-4 flex flex-wrap items-center gap-3">
                    {course.credentialAvailable && ctLabel ? (
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-slate-300 font-medium">Credential available:</span>
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${ctColor}`}>
                          {ctLabel}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck className="h-4 w-4" />
                        <span>No official credential offered for this course</span>
                      </div>
                    )}

                    {/* Actions */}
                    {!isLocked && (
                      <div className="ml-auto flex items-center gap-2">
                        {course.active === true &&
                         course.officialUrlStatus === "VERIFIED" &&
                         course.officialUrl &&
                         /^https?:\/\//i.test(course.officialUrl) ? (
                          <LearnOfficialButton
                            skillId={skill.id}
                            courseId={course.id}
                            officialUrl={course.officialUrl}
                            label="Open Official Course"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                            Link Pending
                          </span>
                        )}

                        {/* SkillLocker certificate flow */}
                        {isSelected && (
                          <>
                            {state === "LEARNING" && (
                              <form action="/api/student/learning" method="post">
                                <input type="hidden" name="skillId" value={skill.id} />
                                <input type="hidden" name="action" value="complete" />
                                <SubmitButton
                                  pendingText="Saving..."
                                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
                                >
                                  Mark Learning Complete
                                </SubmitButton>
                              </form>
                            )}
                            {state === "LEARNING_COMPLETED" && (
                              <Link href="/student/certificates" className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white">
                                Upload Certificate
                              </Link>
                            )}

                            {(state === "PENDING_VERIFICATION" || state === "VERIFIED" || state === "REJECTED" || state === "NEEDS_RESUBMISSION") && (
                              <Link href="/student/certificates" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all">
                                SkillLocker
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note about learning flow */}
      {!isLocked && courses.length > 0 && state === "NOT_STARTED" && (
        <div className="glass-panel rounded-2xl p-5 border-slate-800/80">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">How the learning flow works:</p>
              <ol className="list-decimal list-inside space-y-0.5 ml-1">
                <li>Click <strong className="text-white">Learn Officially</strong> to open the provider's official course page.</li>
                <li>Complete the course on the provider's platform at your own pace.</li>
                <li>Return here and click <strong className="text-white">Mark Learning Complete</strong>.</li>
                <li>Upload your original provider certificate to <strong className="text-white">SkillLocker</strong>.</li>
                <li>The uploaded certificate will remain pending until an admin verifies it.</li>
                <li>Only admin-verified certificates count toward your progression and skill coverage.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
