import { db } from "../src/lib/db";
import { getStudentProgression } from "../src/lib/progression";

async function benchmark() {
  console.log("=== API & BACKEND PERFORMANCE BENCHMARK ===");

  // Find sample student ID
  const student = await db.studentProfile.findFirst({
    select: { id: true, userId: true },
  });

  if (!student) {
    console.log("No student profile found for benchmark.");
    process.exit(0);
  }

  // 1. Benchmark Student Dashboard queries
  console.time("Student Dashboard Queries (Sequential)");
  const p1 = await db.studentProfile.findUnique({
    where: { id: student.id },
    select: { id: true, fullName: true, registerNumber: true, department: { select: { name: true } }, section: { select: { name: true } } },
  });
  const prog1 = await getStudentProgression(student.id);
  const skills1 = await db.studentSkill.findMany({
    where: { studentId: student.id },
    take: 10,
    select: { id: true, skillId: true, state: true, skill: { select: { name: true } } },
  });
  console.timeEnd("Student Dashboard Queries (Sequential)");

  console.time("Student Dashboard Queries (Parallel Promise.all)");
  const [p2, prog2, skills2] = await Promise.all([
    db.studentProfile.findUnique({
      where: { id: student.id },
      select: { id: true, fullName: true, registerNumber: true, department: { select: { name: true } }, section: { select: { name: true } } },
    }),
    getStudentProgression(student.id),
    db.studentSkill.findMany({
      where: { studentId: student.id },
      take: 10,
      select: { id: true, skillId: true, state: true, skill: { select: { name: true } } },
    }),
  ]);
  console.timeEnd("Student Dashboard Queries (Parallel Promise.all)");

  // 2. Benchmark Catalogue / Courses page queries
  console.time("Catalogue Skills List (Lightweight Select)");
  const catSkills = await db.skill.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { id: true, name: true } },
      level: { select: { id: true, name: true, order: true } },
      _count: { select: { courses: true } },
    },
    take: 24,
  });
  console.timeEnd("Catalogue Skills List (Lightweight Select)");

  // 3. Benchmark Admin Students Directory
  console.time("Admin Students Directory (Paginated with Select)");
  const adminStudents = await db.studentProfile.findMany({
    take: 20,
    select: {
      id: true,
      fullName: true,
      registerNumber: true,
      year: true,
      user: { select: { email: true, status: true, lastLoginAt: true } },
      department: { select: { name: true } },
      section: { select: { name: true } },
      _count: { select: { certificates: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  console.timeEnd("Admin Students Directory (Paginated with Select)");

  // 4. Benchmark Admin Certificate Requests
  console.time("Admin Certificate Requests Query");
  const certRequests = await db.certificate.findMany({
    select: {
      id: true,
      status: true,
      submittedAt: true,
      student: {
        select: {
          fullName: true,
          registerNumber: true,
          department: { select: { name: true } },
          section: { select: { name: true } },
          user: { select: { email: true } },
        },
      },
      skill: { select: { name: true } },
      course: { select: { name: true, title: true } },
      provider: { select: { name: true } },
    },
    orderBy: { submittedAt: "desc" },
    take: 50,
  });
  console.timeEnd("Admin Certificate Requests Query");

  process.exit(0);
}

benchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
