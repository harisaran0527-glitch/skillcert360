import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, getRoleDashboardPath, getRolePasswordPath } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = loginSchema.safeParse(form);
  if (!parsed.success) return NextResponse.redirect(new URL("/student/login?error=Enter a valid email or register number and password", request.url), 303);

  const user = await db.user.findFirst({
    where: {
      role: "STUDENT",
      OR: [{ email: parsed.data.identifier.toLowerCase() }, { studentProfile: { registerNumber: parsed.data.identifier } }],
    },
    include: { studentProfile: true },
  });

  if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.redirect(new URL("/student/login?error=Invalid credentials", request.url), 303);
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({ userId: user.id, role: user.role, mustChangePassword: user.mustChangePassword });
  await db.activityLog.create({ data: { userId: user.id, studentId: user.studentProfile?.id, action: "STUDENT_LOGIN" } });

  return NextResponse.redirect(
    new URL(user.mustChangePassword ? getRolePasswordPath("STUDENT") : getRoleDashboardPath("STUDENT"), request.url), 303,
  );
}
