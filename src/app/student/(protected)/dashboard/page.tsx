import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { expireStudentAttempts } from "@/lib/assessment";
import { getSkillProgressState } from "@/lib/progress";
export default async function StudentDashboard() {
 const session = await getSession();
 if (!session || session.role !== "STUDENT") redirect("/student/login");
 const profile = await db.studentProfile.findUnique({ where: { userId: session.userId }, include: { department: true, section: true } });
 if (!profile) redirect("/student/login");
 await expireStudentAttempts(profile.id);
 const [skills, attempts, certificates] = await Promise.all([
  db.studentSkill.findMany({ where: { studentId: profile.id }, include: { skill: true } }),
  db.assessmentAttempt.findMany({ where: { studentId: profile.id }, orderBy: { startedAt: "desc" } }),
  db.certificate.findMany({ where: { studentId: profile.id } }),
 ]);
 const latest = new Map<string, typeof attempts[number]>();
 for (const attempt of attempts) if (!latest.has(attempt.skillId)) latest.set(attempt.skillId, attempt);
 const counts = {
  "Skills Started": skills.length, Learning: skills.filter(s => !s.completedAt).length,
  "Assessments Attempted": attempts.length, Passed: attempts.filter(a => a.passed === true).length, Failed: attempts.filter(a => a.passed === false).length,
  "Re-exams Pending": [...latest.values()].filter(a => a.passed === false).length,
  "Certificates Submitted": certificates.filter(c => c.submittedAt).length,
  "Certificates Verified": certificates.filter(c => c.status === "VERIFIED").length,
  "Certificates Pending": certificates.filter(c => ["SUBMITTED", "PENDING_VERIFICATION"].includes(c.status)).length,
 };
 return <main className="mx-auto max-w-6xl space-y-7 p-8">
  <h1 className="text-4xl font-bold">Welcome, {profile.fullName}</h1>
  <p>{profile.registerNumber} · {profile.department.name} · Year {profile.year} · Section {profile.section.name}</p>
  <nav className="flex gap-5 text-blue-700"><Link href="/student/skills">Browse skills</Link><Link href="/student/certificates">Certificates</Link><form action="/api/auth/logout" method="post"><button>Sign out</button></form></nav>
  <div className="grid gap-4 sm:grid-cols-3">{Object.entries(counts).map(([label, count]) => <div key={label} className="rounded-xl border bg-white p-5"><p>{label}</p><strong className="text-3xl">{count}</strong></div>)}</div>
  <h2 className="text-2xl font-bold">Your skills</h2>
  {await Promise.all(skills.map(async entry => <article key={entry.id} className="rounded-xl border bg-white p-5"><Link href={`/student/skills/${entry.skill.slug}`} className="font-bold text-blue-700">{entry.skill.name}</Link><p>{await getSkillProgressState(profile.id, entry.skillId)}</p>{latest.get(entry.skillId)?.submittedAt === null && <Link className="text-blue-700" href={`/student/assessment/${latest.get(entry.skillId)!.id}`}>Resume assessment</Link>}{latest.get(entry.skillId)?.reexamAvailableAt && <p>Re-exam available: {latest.get(entry.skillId)!.reexamAvailableAt!.toLocaleString()}</p>}</article>))}
 </main>;
}
