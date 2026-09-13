import { resolveStudentSection } from "@/lib/academic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { editStudentSchema, resetPasswordSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/students/[id] — edit student info
export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const profile = await db.studentProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = editStudentSchema.safeParse(form);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid data";
    return NextResponse.redirect(
      new URL(`/admin/students/${id}?error=${encodeURIComponent(msg)}`, request.url),
      303,
    );
  }

  const { fullName, registerNumber, email, departmentId, year } = parsed.data;

  const section = await resolveStudentSection(departmentId, parsed.data);
  if (!section)
    return NextResponse.redirect(
      new URL(
        `/admin/students/${id}?error=Section+must+belong+to+the+selected+active+department`,
        request.url,
      ),
      303,
    );

  try {
    await db.$transaction([
      db.studentProfile.update({
        where: { id },
        data: { fullName, registerNumber, departmentId, year, sectionId: section.id },
      }),
      db.user.update({
        where: { id: profile.userId },
        data: { email: email.trim().toLowerCase() },
      }),
    ]);

    await db.activityLog.create({
      data: {
        userId: session.userId,
        studentId: id,
        action: "STUDENT_EDITED",
        metadata: { registerNumber, email },
      },
    });

    return NextResponse.redirect(
      new URL(`/admin/students/${id}?updated=1`, request.url),
      303,
    );
  } catch {
    return NextResponse.redirect(
      new URL(
        `/admin/students/${id}?error=Email+or+register+number+already+in+use`,
        request.url,
      ),
      303,
    );
  }
}

// POST /api/admin/students/[id] — sub-action dispatch (reset-password, status)
export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const profile = await db.studentProfile.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = Object.fromEntries((await request.formData()).entries());
  const action = String(form._action ?? "");

  // ─── Edit Student ─────────────────────────────────────────────────────────
  if (action === "edit") {
    const parsed = editStudentSchema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid data";
      return NextResponse.redirect(
        new URL(`/admin/students/${id}?error=${encodeURIComponent(msg)}`, request.url),
        303,
      );
    }

    const { fullName, registerNumber, email, departmentId, year } = parsed.data;

    const section = await resolveStudentSection(departmentId, parsed.data);
    if (!section)
      return NextResponse.redirect(
        new URL(
          `/admin/students/${id}?error=Section+must+belong+to+the+selected+active+department`,
          request.url,
        ),
        303,
      );

    try {
      await db.$transaction([
        db.studentProfile.update({
          where: { id },
          data: { fullName, registerNumber, departmentId, year, sectionId: section.id },
        }),
        db.user.update({
          where: { id: profile.userId },
          data: { email: email.trim().toLowerCase() },
        }),
      ]);

      await db.activityLog.create({
        data: {
          userId: session.userId,
          studentId: id,
          action: "STUDENT_EDITED",
          metadata: { registerNumber, email },
        },
      });

      return NextResponse.redirect(
        new URL(`/admin/students/${id}?updated=1`, request.url),
        303,
      );
    } catch {
      return NextResponse.redirect(
        new URL(
          `/admin/students/${id}?error=Email+or+register+number+already+in+use`,
          request.url,
        ),
        303,
      );
    }
  }

  // ─── Reset Password ───────────────────────────────────────────────────────
  if (action === "reset-password") {
    const parsed = resetPasswordSchema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid password data";
      return NextResponse.redirect(
        new URL(`/admin/students/${id}?error=${encodeURIComponent(msg)}`, request.url),
        303,
      );
    }

    await db.user.update({
      where: { id: profile.userId },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.newPassword, 12),
        mustChangePassword: true,
      },
    });

    await db.activityLog.create({
      data: {
        userId: session.userId,
        studentId: id,
        action: "PASSWORD_RESET",
        metadata: {},
      },
    });

    return NextResponse.redirect(
      new URL(`/admin/students/${id}?pwdReset=1`, request.url),
      303,
    );
  }

  // ─── Disable / Enable ─────────────────────────────────────────────────────
  if (action === "set-status") {
    const newStatus = String(form.status ?? "") as "ACTIVE" | "DISABLED";
    if (newStatus !== "ACTIVE" && newStatus !== "DISABLED")
      return NextResponse.redirect(
        new URL(`/admin/students/${id}?error=Invalid+status`, request.url),
        303,
      );

    await db.user.update({
      where: { id: profile.userId },
      data: { status: newStatus },
    });

    await db.activityLog.create({
      data: {
        userId: session.userId,
        studentId: id,
        action: newStatus === "DISABLED" ? "ACCOUNT_DISABLED" : "ACCOUNT_ENABLED",
        metadata: {},
      },
    });

    return NextResponse.redirect(
      new URL(`/admin/students/${id}?statusChanged=1`, request.url),
      303,
    );
  }

  return NextResponse.redirect(
    new URL(`/admin/students/${id}?error=Unknown+action`, request.url),
    303,
  );
}
