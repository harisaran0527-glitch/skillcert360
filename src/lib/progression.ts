/**
 * Server-side progression service.
 *
 * Unlock rules (based solely on VERIFIED certificate counts):
 *   Beginner  — always unlocked
 *   Advanced  — Beginner VERIFIED >= 25
 *   Pro       — Advanced VERIFIED >= 50
 *   Expert    — Pro      VERIFIED >= 75
 *
 * IMPORTANT: Never store the unlocked state as a boolean.
 * Always re-derive it from live certificate records.
 */
import { db } from "@/lib/db";
import { WorkflowError } from "@/lib/workflow";

// Canonical level names exposed to the rest of the app.
export const LEVEL_NAMES = ["Beginner", "Advanced", "Pro", "Expert"] as const;
export type LevelName = (typeof LEVEL_NAMES)[number];

/** Thresholds: how many VERIFIED certs of the *previous* level are needed. */
export const UNLOCK_THRESHOLDS: Record<LevelName, number> = {
  Beginner: 0,   // always unlocked
  Advanced: 25,  // need 25 VERIFIED Beginner certs
  Pro: 50,       // need 50 VERIFIED Advanced certs
  Expert: 75,    // need 75 VERIFIED Pro certs
};

/** The level whose VERIFIED certs gate each level. */
export const GATING_LEVEL: Record<LevelName, LevelName | null> = {
  Beginner: null,
  Advanced: "Beginner",
  Pro: "Advanced",
  Expert: "Pro",
};

export interface LevelProgression {
  name: LevelName;
  order: number;
  /** Number of VERIFIED certificates the student holds at this level. */
  verifiedCount: number;
  /** Threshold of the *previous* level's verified certs needed to unlock this level. */
  threshold: number;
  /** True only for Beginner or when the gating level count satisfies the threshold. */
  unlocked: boolean;
  /** Certs still needed (0 if already unlocked). */
  remaining: number;
}

export interface StudentProgression {
  levels: LevelProgression[];
  /** The highest level that is currently unlocked. */
  highestUnlocked: LevelName;
  /** The next locked level, or null if Expert is already unlocked. */
  nextLocked: LevelName | null;
  /** Certs needed to unlock the next level (0 if fully unlocked). */
  certsNeeded: number;
}

/**
 * Calculate full progression state for a student.
 * All data is read directly from the database — nothing is cached
 * or stored as a derived boolean.
 */
export async function getStudentProgression(studentId: string): Promise<StudentProgression> {
  // Fetch verified certificate levels in a single targeted query
  const verifiedCerts = await db.certificate.findMany({
    where: { studentId, status: "VERIFIED" },
    select: { skill: { select: { level: { select: { name: true } } } } },
  });

  const verifiedByLevel: Record<LevelName, number> = {
    Beginner: 0,
    Advanced: 0,
    Pro: 0,
    Expert: 0,
  };

  for (const c of verifiedCerts) {
    const lvlName = c.skill.level.name as LevelName;
    if (lvlName in verifiedByLevel) {
      verifiedByLevel[lvlName]++;
    }
  }

  const levels: LevelProgression[] = [];

  for (let i = 0; i < LEVEL_NAMES.length; i++) {
    const name = LEVEL_NAMES[i];
    const threshold = UNLOCK_THRESHOLDS[name];
    const gatingLevel = GATING_LEVEL[name];
    const gatingCount = gatingLevel ? verifiedByLevel[gatingLevel] : Infinity;

    const unlocked = name === "Beginner" || gatingCount >= threshold;
    const remaining = unlocked ? 0 : Math.max(0, threshold - gatingCount);

    levels.push({
      name,
      order: i + 1,
      verifiedCount: verifiedByLevel[name],
      threshold,
      unlocked,
      remaining,
    });
  }

  const highestUnlocked = [...levels].reverse().find((l) => l.unlocked)?.name ?? "Beginner";
  const nextLockedLevel = levels.find((l) => !l.unlocked) ?? null;

  return {
    levels,
    highestUnlocked,
    nextLocked: nextLockedLevel?.name ?? null,
    certsNeeded: nextLockedLevel?.remaining ?? 0,
  };
}

/**
 * Check whether a student can access skills of a given level name.
 * Throws a 403 WorkflowError if the level is locked.
 */
export async function assertLevelUnlocked(studentId: string, levelName: string): Promise<void> {
  // Beginner is always unlocked — skip expensive DB lookup.
  if (levelName === "Beginner") return;

  // Only enforce for the 4 canonical levels.
  if (!LEVEL_NAMES.includes(levelName as LevelName)) return;

  const name = levelName as LevelName;
  const gatingLevel = GATING_LEVEL[name]!;
  const threshold = UNLOCK_THRESHOLDS[name];

  // Count VERIFIED certs at the gating level.
  const gatingLevelRecord = await db.skillLevel.findFirst({ where: { name: gatingLevel } });
  if (!gatingLevelRecord) return; // Unknown level config — fail open for admin flexibility.

  const count = await db.certificate.count({
    where: {
      studentId,
      status: "VERIFIED",
      skill: { levelId: gatingLevelRecord.id },
    },
  });

  if (count < threshold) {
    throw new WorkflowError(
      `${name} is locked. Verify ${threshold} ${gatingLevel} certificates to unlock it. You have ${count} verified.`,
      403,
    );
  }
}

/**
 * Given a skill ID, resolve its level name and assert the student can access it.
 */
export async function assertSkillLevelUnlocked(studentId: string, skillId: string): Promise<void> {
  const skill = await db.skill.findUnique({
    where: { id: skillId },
    include: { level: true },
  });
  if (!skill) return; // Skill not found — let subsequent checks handle it.
  await assertLevelUnlocked(studentId, skill.level.name);
}
