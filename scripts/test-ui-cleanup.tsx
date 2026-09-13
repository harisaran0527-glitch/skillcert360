import "dotenv/config";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { SectionSelect } from "../src/components/section-select";
import { VALID_SECTIONS, isValidSection, deduplicateByNormalizedKey } from "../src/lib/ui-options";
import { editStudentSchema } from "../src/lib/validation";
import { getCleanDepartments } from "../src/lib/academic";
import { getCanonicalCourseIds } from "../src/lib/catalogue-visibility";
import { db } from "../src/lib/db";

async function main() {
  for (const value of [...VALID_SECTIONS, "TEST", "T1", "D", "", "a"]) {
    const markup = renderToStaticMarkup(<SectionSelect value={value} />);
    const options = [...markup.matchAll(/<option[^>]*value="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(options, [...VALID_SECTIONS]);
    assert.equal(new Set(options).size, options.length);
    assert.equal(isValidSection(value), VALID_SECTIONS.some(section => section === value));
  }
  assert.deepEqual(deduplicateByNormalizedKey([{ name: " CSE " }, { name: "cse" }, { name: "IT" }, { name: " " }], row => row.name), [{ name: " CSE " }, { name: "IT" }]);
  const fields = { fullName: "Existing Student", registerNumber: "R100", email: "existing@example.test", departmentId: "c123456789012345678901234", year: 2 };
  for (const sectionName of VALID_SECTIONS) assert.equal(editStudentSchema.safeParse({ ...fields, sectionName }).success, true);
  for (const sectionName of ["TEST", "T1", "D"]) assert.equal(editStudentSchema.safeParse({ ...fields, sectionName }).success, false);
  const [departments, ids, courses, students] = await Promise.all([getCleanDepartments(), getCanonicalCourseIds(), db.course.count(), db.studentProfile.count()]);
  assert.equal(new Set(departments.map(row => row.name.trim().toLowerCase())).size, departments.length);
  assert.ok(departments.every(row => !/^(?:test|testing|demo|sample|e2e|prog-test)(?:$|[-_ ])/i.test(row.name.trim())));
  assert.equal(new Set(ids).size, ids.length);
  console.log(JSON.stringify({ result: "PASS", sections: VALID_SECTIONS, legacyValuesSelectable: false, uniqueDepartments: departments.length, duplicateCourseMappingsHidden: courses - ids.length, studentsRetained: students, databaseWrites: 0 }, null, 2));
}
main().finally(() => db.$disconnect()).catch(error => { console.error(error); process.exitCode = 1; });
