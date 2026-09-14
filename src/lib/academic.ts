import { db } from "./db";
import { deduplicateByNormalizedKey, isValidSection, VALID_SECTIONS } from "./ui-options";
import { productionDepartmentWhere } from "./production-ui";
import { unstable_cache } from "next/cache";
export * from "./ui-options";

export const getCleanDepartments = unstable_cache(
  async () => {
    const departments = await db.department.findMany({ where: productionDepartmentWhere, orderBy: [{ name: "asc" }, { id: "asc" }] });
    return deduplicateByNormalizedKey(departments, department => department.name);
  },
  ["clean-departments"],
  { revalidate: 600, tags: ["academic"] }
);

export async function resolveStudentSection(departmentId: string, selection: { sectionName?: string; sectionId?: string }) {
  const department = await db.department.findFirst({ where: { id: departmentId, ...productionDepartmentWhere } });
  if (!department) return null;
  if (selection.sectionName && isValidSection(selection.sectionName)) {
    // B/C may not have legacy rows. Create the relation only on an explicit admin save.
    return db.section.upsert({ where: { name_departmentId: { name: selection.sectionName, departmentId } }, create: { name: selection.sectionName, departmentId }, update: {} });
  }
  if (!selection.sectionId) return null;
  return db.section.findFirst({ where: { id: selection.sectionId, departmentId, name: { in: [...VALID_SECTIONS] } } });
}
