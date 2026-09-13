import { AccountStatus, CertificateStatus, CredentialType, Difficulty, QuestionType } from "@prisma/client";

export const VALID_SECTIONS = ["A", "B", "C"] as const;
export type SectionName = (typeof VALID_SECTIONS)[number];
export const isValidSection = (value: string): value is SectionName => VALID_SECTIONS.some(section => section === value);
export const displaySection = (value: string) => isValidSection(value) ? value : "Unassigned (legacy record)";
export const ACADEMIC_YEARS = [1, 2, 3, 4] as const;
export const ACCOUNT_STATUSES = Object.values(AccountStatus);
export const CERTIFICATE_STATUSES = Object.values(CertificateStatus);
export const QUESTION_TYPES = Object.values(QuestionType);
export const QUESTION_DIFFICULTIES = Object.values(Difficulty);
export const CREDENTIAL_TYPES = Object.values(CredentialType);

export function deduplicateByNormalizedKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = getKey(item).trim().replace(/\s+/g, " ").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
