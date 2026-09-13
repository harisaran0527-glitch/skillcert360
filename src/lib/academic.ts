import { db } from "./db";

export interface CleanDepartment {
  id: string;
  name: string;
  active: boolean;
}

export interface CleanSection {
  id: string;
  name: string;
  departmentId: string;
  department: CleanDepartment;
}

// Single Source of Truth Constants
export const VALID_SECTIONS = ["A", "B", "C"] as const;

export const ACADEMIC_YEARS = [1, 2, 3, 4] as const;

export const ACCOUNT_STATUSES = ["ACTIVE", "DISABLED"] as const;

export const CERTIFICATE_STATUSES = [
  "LOCKED",
  "UNLOCKED",
  "PENDING_SUBMISSION",
  "SUBMITTED",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "NEEDS_RESUBMISSION",
] as const;

export const QUESTION_TYPES = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "CODING",
  "FILL_BLANK",
  "PRACTICAL",
] as const;

export const QUESTION_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export const CREDENTIAL_TYPES = [
  "NONE",
  "COMPLETION_CERTIFICATE",
  "DIGITAL_BADGE",
  "ACHIEVEMENT",
  "APPLIED_SKILL",
  "MICROCREDENTIAL",
  "PROFESSIONAL_CERTIFICATION",
] as const;

/**
 * Normalizes string keys and deduplicates objects in an array.
 * Trims whitespace, performs case-insensitive comparison, and filters empty/null keys.
 */
export function deduplicateByNormalizedKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const rawKey = getKey(item);
    if (!rawKey) continue;
    const normalizedKey = rawKey.trim().toLowerCase();
    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      result.push(item);
    }
  }
  return result;
}

/**
 * Returns active non-test departments sorted alphabetically and deduplicated.
 */
export async function getCleanDepartments(): Promise<CleanDepartment[]> {
  const departments = await db.department.findMany({
    where: {
      active: true,
      NOT: [
        { name: { startsWith: "E2E-" } },
        { name: { startsWith: "PROG-TEST-" } },
        { name: { startsWith: "TEST" } },
        { name: { startsWith: "DEMO" } },
      ],
    },
    orderBy: { name: "asc" },
  });
  return deduplicateByNormalizedKey(departments, (d) => d.name);
}

/**
 * Returns sections belonging to active non-test departments strictly restricted to ["A", "B", "C"].
 */
export async function getCleanSections(): Promise<CleanSection[]> {
  const sections = await db.section.findMany({
    where: {
      name: { in: [...VALID_SECTIONS] },
      department: {
        active: true,
        NOT: [
          { name: { startsWith: "E2E-" } },
          { name: { startsWith: "PROG-TEST-" } },
          { name: { startsWith: "TEST" } },
          { name: { startsWith: "DEMO" } },
        ],
      },
    },
    include: { department: true },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  });
  return deduplicateByNormalizedKey(sections, (s) => `${s.departmentId}:${s.name}`);
}
