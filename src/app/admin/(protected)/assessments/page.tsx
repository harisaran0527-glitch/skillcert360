import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { expireStudentAttempts } from "@/lib/assessment";
export default async function AssessmentAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const params = await searchParams;
 const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
 await expireStudentAttempts();
 const date = /^\d{4}-\d{2}-\d{2}$/.test(value("date")) ? new Date(value("date") + "T00:00:00+05:30") : null;
 const student: Prisma.StudentProfileWhereInput = {};
 if (value("department")) student.departmentId = value("department");
 if (/^[1-8]$/.test(value("year"))) student.year = Number(value("year"));
 if (value("section")) student.sectionId = value("section");
 const where: Prisma.AssessmentAttemptWhereInput = { student };
 if (value("skill")) where.skillId = value("skill");
 if (["pass", "fail"].includes(value("result"))) where.passed = value("result") === "pass";
 if (date && Number.isFinite(date.getTime())) where.startedAt = { gte: date, lt: new Date(date.getTime() + 86400000) };
 const [attempts, departments, sections, skills] = await Promise.all([
  db.assessmentAttempt.findMany({ where, include: { student: true, skill: true, violations: { orderBy: { occurredAt: "asc" } } }, orderBy: { startedAt: "desc" } }),
  db.department.findMany(), db.section.findMany({ include: { department: true } }), db.skill.findMany(),
 ]);
 return <main className="space-y-6"><h1 className="text-4xl font-bold">Assessments</h1>
 <form className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
 <label>Department<select name="department" defaultValue={value("department")}><option value="">All</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
 <label>Year<select name="year" defaultValue={value("year")}><option value="">All</option>{Array.from({ length: 8 }, (_, i) => <option key={i}>{i + 1}</option>)}</select></label>
 <label>Section<select name="section" defaultValue={value("section")}><option value="">All</option>{sections.map(s => <option key={s.id} value={s.id}>{s.department.name} / {s.name}</option>)}</select></label>
 <label>Skill<select name="skill" defaultValue={value("skill")}><option value="">All</option>{skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 <label>Pass/Fail<select name="result" defaultValue={value("result")}><option value="">All</option><option value="pass">Pass</option><option value="fail">Fail</option></select></label>
 <label>Date (India)<input type="date" name="date" defaultValue={value("date")} /></label><button className="rounded bg-blue-700 px-4 py-2 text-white">Apply filters</button><Link href="/admin/assessments">Reset</Link>
 </form><p>{attempts.length} attempts</p>
 <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{["Student", "Skill", "Attempt number", "Score", "Pass/Fail", "Duration", "Violations", "Start time", "Submit time", "Auto-submit status"].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
 <tbody>{attempts.map(a => <tr key={a.id} className="border-t">
 <td className="p-3"><Link href={`/admin/students/${a.studentId}`}>{a.student.fullName}</Link><p>{a.student.registerNumber}</p></td><td className="p-3">{a.skill.name}</td><td className="p-3">{a.attemptNumber}</td><td className="p-3">{a.score ?? "—"}/{a.questionCount}</td><td className="p-3">{a.passed === null ? "In progress" : a.passed ? "Pass" : "Fail"}</td><td className="p-3">{Math.max(0, Math.round(((a.submittedAt ?? new Date()).getTime() - a.startedAt.getTime()) / 1000))} sec</td>
 <td className="p-3"><details><summary>{a.violations.length}</summary>{a.violations.map(v => <p key={v.id}>{v.type} · {v.occurredAt.toISOString()}</p>)}</details></td><td className="p-3">{a.startedAt.toLocaleString()}</td><td className="p-3">{a.submittedAt?.toLocaleString() ?? "—"}</td><td className="p-3">{a.autoSubmitted ? "Yes" : "No"} · {a.submissionReason ?? "Active"}{a.terminated ? " · Terminated" : ""}</td>
 </tr>)}</tbody></table></div></main>;
}
