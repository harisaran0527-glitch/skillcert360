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

/**
 * Returns active non-test departments sorted alphabetically.
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
  return departments;
}

/**
 * Returns sections belonging to active non-test departments, sorted naturally.
 */
export async function getCleanSections(): Promise<CleanSection[]> {
  const sections = await db.section.findMany({
    where: {
      department: {
        active: true,
        NOT: [
          { name: { startsWith: "E2E-" } },
          { name: { startsWith: "PROG-TEST-" } },
          { name: { startsWith: "TEST" } },
          { name: { startsWith: "DEMO" } },
        ],
      },
      NOT: [
        { name: { startsWith: "TEST" } },
      ],
    },
    include: { department: true },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  });
  return sections;
}
