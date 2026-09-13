import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { productionStudentWhere } from "../src/lib/production-ui";
const db = new PrismaClient();
async function main() {
  const [departments, sections, skills, providers, courses, students] = await Promise.all([
    db.department.findMany(), db.section.groupBy({ by: ["name"], _count: true }),
    db.skill.findMany({ select: { id: true, name: true, levelId: true, categoryId: true } }),
    db.provider.findMany({ select: { id: true, name: true } }),
    db.course.findMany({ select: { id: true, name: true, skillId: true, providerId: true } }), db.studentProfile.count(),
  ]);
  const duplicates = <T,>(rows: T[], key: (row: T) => string) => {
    const counts = new Map<string, number>();
    for (const row of rows) { const name = key(row).trim().toLowerCase(); counts.set(name, (counts.get(name) ?? 0) + 1); }
    return [...counts.values()].filter(count => count > 1).reduce((sum, count) => sum + count - 1, 0);
  };
  console.log("Visible production students:", await db.studentProfile.count({ where: productionStudentWhere }));
  console.log(JSON.stringify({ studentCount: students, departments: departments.map(d => ({ name: d.name, active: d.active })), sectionNames: sections.map(s => ({ name: s.name, count: s._count })), duplicateSkills: duplicates(skills, s => `${s.name}:${s.levelId}:${s.categoryId}`), duplicateProviders: duplicates(providers, p => p.name), duplicateCourses: duplicates(courses, c => `${c.name}:${c.skillId}:${c.providerId}`), configuredCredentialKeys: Object.keys(process.env).filter(key => /ADMIN|STUDENT|E2E/.test(key)) }, null, 2));
}
main().finally(() => db.$disconnect()).catch(error => { console.error(error); process.exitCode = 1; });
