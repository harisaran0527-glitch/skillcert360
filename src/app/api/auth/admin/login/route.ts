import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, getRoleDashboardPath, getRolePasswordPath } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(Object.fromEntries((await request.formData()).entries()));
  if (!parsed.success) return NextResponse.redirect(new URL("/admin/login?error=Enter a valid email and password", request.url), 303);

  const email = parsed.data.identifier.trim().toLowerCase();
  const user = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE" || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.redirect(new URL("/admin/login?error=Invalid credentials", request.url), 303);
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({ userId: user.id, role: user.role, mustChangePassword: user.mustChangePassword });

  return NextResponse.redirect(
    new URL(user.mustChangePassword ? getRolePasswordPath("ADMIN") : getRoleDashboardPath("ADMIN"), request.url), 303,
  );
}