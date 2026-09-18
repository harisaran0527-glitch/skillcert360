import { productionNameWhere, productionSkillWhere, productionCourseWhere } from "@/lib/production-ui";
import { getCanonicalCourseIds } from "@/lib/catalogue-visibility";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { deduplicateByNormalizedKey } from "@/lib/academic";
import { availableCourseWhere, cataloguePage, skillLevelColor } from "@/lib/catalog";
import type { StudentProgression } from "@/lib/progression";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getStudentProgression, UNLOCK_THRESHOLDS, GATING_LEVEL, type LevelName, LEVEL_NAMES } from "@/lib/progression";
import {
  Search,
  Filter,
  Lock,
  Award,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Users,
  BadgeCheck,
  ShieldCheck,
  Globe,
  Zap,
} from "lucide-react";


export default async function StudentSkillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const params = await searchParams;
  const profile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!profile) redirect("/student/login");

  const query = (params.q ?? "").toString().trim().toLowerCase();
  const selectedLevel = (params.level ?? "").toString();
  const selectedCategory = (params.category ?? "").toString();
  const selectedProvider = (params.provider ?? "").toString();
  const selectedPrice = (params.price ?? "").toString();
  const credentialFilter = (params.credential ?? "").toString();
  const selectedState = (params.state ?? "").toString();

  const requestedPage = cataloguePage((params.page ?? "1").toString());
  const pageSize = 24;

  const whereClause: Prisma.SkillWhereInput = { AND: [productionSkillWhere], active: true, category: { active: true }, level: { active: true } };

  if (selectedLevel) whereClause.levelId = selectedLevel;
  if (selectedCategory) whereClause.categoryId = selectedCategory;
  if (query) {
    whereClause.OR = query.length === 1 ? [
      { name: { equals: query, mode: "insensitive" } },
      { name: { startsWith: query + " ", mode: "insensitive" } },
      { name: { startsWith: query + "-", mode: "insensitive" } },
    ] : [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }
  
  const hasCoursesFilter = Boolean(selectedProvider || selectedPrice || credentialFilter);
  if (hasCoursesFilter) {
    const courseIds = await getCanonicalCourseIds();
    const courseWhere: Prisma.CourseWhereInput = { ...availableCourseWhere, AND: [productionCourseWhere], id: { in: courseIds } };
    if (selectedProvider) courseWhere.providerId = selectedProvider;
    if (selectedPrice === "free") courseWhere.pricingType = "FREE";
    if (selectedPrice === "free_exam") courseWhere.pricingType = "FREE_LEARNING_PAID_EXAM";
    if (selectedPrice === "paid") courseWhere.pricingType = "PAID";
    if (selectedPrice === "subscription") courseWhere.pricingType = "SUBSCRIPTION";
    if (selectedPrice === "unknown") courseWhere.pricingType = "UNKNOWN";
    if (credentialFilter === "yes") courseWhere.credentialAvailable = true;
    if (credentialFilter === "no") courseWhere.credentialAvailable = false;
    whereClause.courses = { some: courseWhere };
  }

  const [rawLevels, rawCategories, rawProviders, progression, totalCount, skills] = await Promise.all([
    db.skillLevel.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { order: "asc" } }),
    db.skillCategory.findMany({ where: { active: true, ...productionNameWhere }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.provider.findMany({ where: { active: true, ...productionNameWhere, slug: { not: null } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getStudentProgression(profile.id),
    db.skill.count({ where: whereClause }),
    db.skill.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
        studentSkills: {
          where: { studentId: profile.id },
          select: { id: true, completedAt: true },
        },
      },
      orderBy: [{ level: { order: "asc" } }, { name: "asc" }, { id: "asc" }],
      skip: (Math.max(1, requestedPage) - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const skillIds = skills.map((s) => s.id);
  const courseCountsGroup = skillIds.length > 0
    ? await db.course.groupBy({
        by: ["skillId"],
        where: { ...availableCourseWhere, skillId: { in: skillIds } },
        _count: { _all: true },
      })
    : [];

  const courseCountMap = new Map(courseCountsGroup.map((c) => [c.skillId, c._count._all]));

  const skillsWithCounts = skills.map((s) => ({
    ...s,
    _count: { courses: courseCountMap.get(s.id) ?? 0 },
  }));

  const levels = deduplicateByNormalizedKey(rawLevels, (l) => l.name);
  const categories = deduplicateByNormalizedKey(rawCategories, (c) => c.name);
  const providers = deduplicateByNormalizedKey(rawProviders, (p) => p.name);
  const levelUnlocked = new Map<string, boolean>(
    progression.levels.map((l) => [l.name, l.unlocked])
  );

  const page = Math.min(requestedPage, Math.max(1, Math.ceil(totalCount / pageSize)));
  const totalPages = Math.ceil(totalCount / pageSize);

  // Credential type label
  const credTypeLabel = (type: string) => {
    switch (type) {
      case "COMPLETION_CERTIFICATE": return "Certificate";
      case "DIGITAL_BADGE": return "Digital Badge";
      case "ACHIEVEMENT": return "Achievement";
      case "APPLIED_SKILL": return "Applied Skill";
      case "MICROCREDENTIAL": return "Microcredential";
      case "PROFESSIONAL_CERTIFICATION": return "Professional Cert";
      default: return null;
    }
  };

  const pricingLabel = (type: string) => {
    switch (type) {
      case "FREE": return "Free";
      case "FREE_LEARNING_PAID_EXAM": return "Free Learning / Paid Exam";
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
      default: return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    }
  };

  // Group skills by category for display
  const groupedByCategory: Record<string, typeof skillsWithCounts> = {};
  for (const skill of skillsWithCounts) {
    const catName = skill.category.name;
    if (!groupedByCategory[catName]) groupedByCategory[catName] = [];
    groupedByCategory[catName].push(skill);
  }

  const isGrouped = !query && !selectedLevel && !selectedProvider && !selectedPrice && !credentialFilter;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Official Skills & Multi-Provider Courses</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">
            Explore Skills Catalogue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {totalCount.toLocaleString()} skills available — choose a skill, pick an official provider, and earn verified credentials.
          </p>
        </div>
        {/* Level progress mini badges */}
        <div className="flex gap-2 flex-wrap">
          {progression.levels.map((lvl) => (
            <div
              key={lvl.name}
              className={`flex flex-col items-center glass-panel rounded-xl px-4 py-3 text-center`}
            >
              <span>{lvl.name}</span>
              <span className={lvl.unlocked ? "text-emerald-400" : "text-slate-600"}>
                {lvl.unlocked ? "✓ Unlocked" : `${lvl.verifiedCount}/${UNLOCK_THRESHOLDS[lvl.name as LevelName] ?? "—"}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <form method="get" className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
          <Filter className="h-4 w-4 text-cyan-400" />
          <span>Filter & Search Catalogue</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search skill, provider, technology..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <select name="level" defaultValue={selectedLevel} className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none">
            <option value="">All Progression Levels</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>

          <select name="category" defaultValue={selectedCategory} className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none">
            <option value="">All Skill Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select name="provider" defaultValue={selectedProvider} className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none">
            <option value="">All Providers</option>
            {providers.map((prov) => (
              <option key={prov.id} value={prov.id}>{prov.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-slate-800/60">
          <select name="price" defaultValue={selectedPrice} className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none">
            <option value="">Pricing: All</option>
            <option value="free">Free Learning</option>
            <option value="free_exam">Free Learning / Paid Exam</option>
            <option value="paid">Paid</option>
            <option value="subscription">Subscription</option>
            <option value="unknown">Unknown</option>
          </select>

          <select name="credential" defaultValue={credentialFilter} className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none">
            <option value="">Credential: All</option>
            <option value="yes">Credential Available</option>
            <option value="no">No Credential</option>
          </select>

          <select aria-label="Access state" name="state" defaultValue={selectedState} className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200">
            <option value="">All access states</option><option value="unlocked">Unlocked</option><option value="locked">Locked</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            Apply Filters
          </button>

          <Link
            href="/student/skills"
            className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 text-center transition-all"
          >
            Clear Filters
          </Link>
        </div>
      </form>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {totalCount ? ((page - 1) * pageSize) + 1 : 0}–{Math.min(page * pageSize, totalCount)} of{" "}
          <span className="text-cyan-400 font-semibold">{totalCount.toLocaleString()}</span> skills
        </span>
        {totalPages > 1 && (
          <span className="text-slate-400">Page {page} of {totalPages}</span>
        )}
      </div>

      {/* Skills Display */}
      {isGrouped ? (
        // Grouped by category view
        Object.entries(groupedByCategory).map(([catName, catSkills]) => (
          <div key={catName} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">
                {catName}
              </h2>
              <div className="h-px flex-1 bg-slate-800" />
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {catSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  levelUnlocked={levelUnlocked}
                  progression={progression}
                  credTypeLabel={credTypeLabel}
                  pricingLabel={pricingLabel}
                  pricingColor={pricingColor}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Flat grid (search/filter active)
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {skillsWithCounts.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              levelUnlocked={levelUnlocked}
              progression={progression}
              credTypeLabel={credTypeLabel}
              pricingLabel={pricingLabel}
              pricingColor={pricingColor}
            />
          ))}
        </div>
      )}

      {skills.length === 0 && (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="h-8 w-8 text-slate-500 mx-auto" />
          <p className="text-base font-semibold text-white">No skills match your filters.</p>
          <p className="text-xs text-slate-400">Try clearing your filters or searching for another term.</p>
          <Link href="/student/skills" className="inline-block rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200">
            Clear Filters
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Link
              href={`/student/skills?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v ?? "")])), page: String(page - 1) }).toString()}`}
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 transition-all"
            >
              ← Previous
            </Link>
          )}
          <span className="text-xs text-slate-400 px-4">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/student/skills?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v ?? "")])), page: String(page + 1) }).toString()}`}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// --- Skill Card Component ---
function SkillCard({
  skill,
  levelUnlocked,
  progression,
  credTypeLabel,
  pricingLabel,
  pricingColor,
}: {
  skill: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: { id: string; name: string };
    level: { id: string; name: string };
    _count?: { courses: number };
    studentSkills?: { id: string; completedAt: Date | null }[];
  };
  levelUnlocked: Map<string, boolean>;
  progression: StudentProgression;
  credTypeLabel: (t: string) => string | null;
  pricingLabel: (t: string) => string;
  pricingColor: (t: string) => string;
}) {
  const skillLevelName = skill.level.name;
  const isLocked = LEVEL_NAMES.includes(skillLevelName as LevelName)
    ? !(levelUnlocked.get(skillLevelName) ?? true)
    : false;

  const gating = isLocked ? GATING_LEVEL[skillLevelName as LevelName] : null;
  const threshold = isLocked ? UNLOCK_THRESHOLDS[skillLevelName as LevelName] : 0;
  const gatingCount = gating
    ? (progression.levels.find((l) => l.name === gating)?.verifiedCount ?? 0)
    : 0;
  const remainingCount = Math.max(0, threshold - gatingCount);

  const totalCourses = skill._count?.courses ?? 0;
  const studentSkill = skill.studentSkills?.[0];
  const levelColor = skillLevelColor(skillLevelName);

  return (
    <div
      className={`glass-panel rounded-2xl p-5 relative flex flex-col justify-between overflow-hidden transition-all duration-300 group ${
        isLocked ? "border-amber-500/20 opacity-85" : "glass-panel-hover"
      }`}
    >
      {/* Level badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="space-y-1 flex-1 min-w-0">
          <span className="inline-block rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 truncate max-w-full">
            {skill.category.name}
          </span>
          <h3 className="text-base font-bold text-white font-display leading-tight">
            <Link
              href={`/student/skills/${skill.slug}`}
              className="hover:text-cyan-300 transition-colors"
            >
              {skill.name}
              {isLocked && " 🔒"}
            </Link>
          </h3>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${isLocked ? "border-amber-500/40 bg-amber-500/15 text-amber-300" : levelColor}`}>
          {isLocked && <Lock className="h-2.5 w-2.5" />}
          {skillLevelName}
        </span>
      </div>

      {/* Description */}
      {skill.description && (
        <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{skill.description}</p>
      )}

      {/* Lock banner */}
      {isLocked && gating && (
        <div className="mb-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 mb-1">
            <Lock className="h-3.5 w-3.5" />
            <span>{skillLevelName} Level Locked</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Verify <strong className="text-amber-200">{remainingCount} more {gating} credentials</strong> to unlock.
          </p>
          <div className="text-[10px] text-amber-400/80 font-mono mt-1">{gatingCount} / {threshold} {gating} verified</div>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-between py-3 border-t border-slate-800/60 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <span>{totalCourses} Curated Course{totalCourses !== 1 ? "s" : ""} Available</span>
        </div>
        {!isLocked && <span className="text-xs font-semibold text-emerald-400">✓ Unlocked</span>}
      </div>

      {!isLocked && studentSkill && (
        <div className="space-y-2 mb-3">
          {!studentSkill.completedAt ? (
            <form action="/api/student/learning" method="post">
              <input type="hidden" name="skillId" value={skill.id} />
              <input type="hidden" name="action" value="complete" />
              <button className="text-xs text-cyan-300 font-semibold hover:underline">Mark Learning Complete</button>
            </form>
          ) : (
            <Link href="/student/certificates" className="text-xs text-cyan-300 font-semibold hover:underline">Upload Certificate / SkillLocker</Link>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="pt-3 border-t border-slate-800/60">
        {isLocked ? (
          <div className="flex items-center gap-1.5 justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-400 cursor-not-allowed">
            <Lock className="h-3.5 w-3.5" />
            Level Restricted
          </div>
        ) : (
          <Link
            href={`/student/skills/${skill.slug}`}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            <Zap className="h-3.5 w-3.5" />
            Explore Skill & Courses
          </Link>
        )}
      </div>
    </div>
  );
}
