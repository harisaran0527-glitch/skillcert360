import type { Prisma } from "@prisma/client";

// Presentation-only exclusions. Historical records are retained in the database.
const fixtureNames = ["Test", "Testing", "Demo", "Sample", "E2E", "PROG-TEST"];
// Explicit local E2E opt-in; production always hides fixtures, regardless of this flag.
const localFixtures = process.env.NODE_ENV !== "production" && process.env.E2E_INCLUDE_FIXTURES === "1";
export const productionNameWhere = localFixtures ? {} : {
  NOT: fixtureNames.flatMap(name => [
    { name: { equals: name, mode: "insensitive" as const } },
    ...["-", "_", " "].map(separator => ({ name: { startsWith: name + separator, mode: "insensitive" as const } })),
  ]),
} satisfies Prisma.DepartmentWhereInput;
export const productionDepartmentWhere = { active: true, ...productionNameWhere } satisfies Prisma.DepartmentWhereInput;
export const productionSkillWhere = { ...productionNameWhere, category: productionNameWhere } satisfies Prisma.SkillWhereInput;
export const productionCourseWhere = { ...productionNameWhere, skill: productionSkillWhere, provider: productionNameWhere } satisfies Prisma.CourseWhereInput;
export const productionStudentWhere = { department: productionNameWhere, NOT: localFixtures ? [] : fixtureNames.flatMap(name => [
  { fullName: { equals: name, mode: "insensitive" as const } },
  ...["-", "_", " "].map(separator => ({ fullName: { startsWith: name + separator, mode: "insensitive" as const } })),
]) } satisfies Prisma.StudentProfileWhereInput;
