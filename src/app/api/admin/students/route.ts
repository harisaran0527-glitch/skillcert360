import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { studentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = studentSchema.safeParse(Object.fromEntries((await request.formData()).entries()));
  if (!parsed.success) return NextResponse.redirect(new URL("/admin/students?error=Check the student details", request.url), 303);
  try {
    const { fullName, registerNumber, email, departmentId, year, sectionId, temporaryPassword } = parsed.data;
    const section = await db.section.findFirst({ where: { id: sectionId, departmentId, department: { active: true } } });
    if (!section) return Response.json({ error: "Section must belong to the selected active department" }, { status: 400 });
    const user = await db.user.create({ data: { email: email.toLowerCase(), passwordHash: await bcrypt.hash(temporaryPassword, 12), role: "STUDENT", mustChangePassword: true, studentProfile: { create: { fullName, registerNumber, departmentId, year, sectionId } } } });
    const profile = await db.studentProfile.findUniqueOrThrow({ where: { userId: user.id } });
    await db.activityLog.create({ data: { userId: session.userId, studentId: profile.id, action: "STUDENT_CREATED", metadata: { registerNumber } } });
    return NextResponse.redirect(new URL("/admin/students?created=1", request.url), 303);
  } catch { return NextResponse.redirect(new URL("/admin/students?error=Email, register number, or section already exists", request.url), 303); }
}
