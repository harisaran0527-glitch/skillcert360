import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, getRoleDashboardPath, getRolePasswordPath, getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const form = await request.formData();
  const password = String(form.get("password") || "");

  if (password.length < 8 || password.length > 128) {
    return NextResponse.redirect(new URL(`${getRolePasswordPath(session.role)}?error=Password must be at least 8 characters`, request.url), 303);
  }

  await db.user.update({
    where: { id: session.userId },
    data: { passwordHash: await bcrypt.hash(password, 12), mustChangePassword: false },
  });

  await createSession({ ...session, mustChangePassword: false });
  const profile = await db.studentProfile.findUnique({ where: { userId: session.userId } });
  await db.activityLog.create({ data: { userId: session.userId, studentId: profile?.id, action: "PASSWORD_CHANGED" } });
  return NextResponse.redirect(new URL(getRoleDashboardPath(session.role), request.url), 303);
}
