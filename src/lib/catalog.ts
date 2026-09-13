import type { Prisma } from "@prisma/client";

export type CatalogueParams = Record<string, string | string[] | undefined>;
export const param = (params: CatalogueParams, key: string) => {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
};
export function cataloguePage(value: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1;
}
export const availableCourseWhere = {
  active: true, provider: { active: true },
  officialUrlStatus: { in: ["VERIFIED", "OFFICIAL_LINK_PENDING"] },
} satisfies Prisma.CourseWhereInput;

const levelColors: Record<string, string> = {
  Beginner: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  Advanced: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  Pro: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  Expert: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};
export const skillLevelColor = (name: string) => levelColors[name] ?? "border-slate-700 bg-slate-800 text-slate-300";
