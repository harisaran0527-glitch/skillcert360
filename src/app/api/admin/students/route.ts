import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { studentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = studentSchema.safeParse(form);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Check the student details";
    return NextResponse.redirect(
      new URL(`/admin/students?error=${encodeURIComponent(msg)}`, request.url),
      303,
    );
  }

  try {
    const {
      fullName,
      registerNumber,
      email,
      departmentId,
      year,
      sectionId,
      temporaryPassword,
      status,
    } = parsed.data;

    // Verify section belongs to the selected active department
    const section = await db.section.findFirst({
      where: { id: sectionId, departmentId, department: { active: true } },
    });
    if (!section)
      return NextResponse.redirect(
        new URL(
          "/admin/students?error=Section+must+belong+to+the+selected+active+department",
          request.url,
        ),
        303,
      );

    const user = await db.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash: await bcrypt.hash(temporaryPassword, 12),
        role: "STUDENT",
        status: status as "ACTIVE" | "DISABLED",
        mustChangePassword: true,
        studentProfile: {
          create: { fullName, registerNumber, departmentId, year, sectionId },
        },
      },
    });

    const profile = await db.studentProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });

    await db.activityLog.create({
      data: {
        userId: session.userId,
        studentId: profile.id,
        action: "STUDENT_CREATED",
        metadata: { registerNumber, email: user.email, status },
      },
    });

    // Redirect with one-time credential params (email + registerNumber; NOT the plaintext password)
    const params = new URLSearchParams({
      created: "1",
      cEmail: user.email,
      cReg: registerNumber,
      cName: fullName,
      cPwd: temporaryPassword, // shown ONCE to admin — never stored in plaintext in DB
    });
    return NextResponse.redirect(
      new URL(`/admin/students?${params.toString()}`, request.url),
      303,
    );
  } catch {
    return NextResponse.redirect(
      new URL(
        "/admin/students?error=Email+or+register+number+already+exists",
        request.url,
      ),
      303,
    );
  }
}
