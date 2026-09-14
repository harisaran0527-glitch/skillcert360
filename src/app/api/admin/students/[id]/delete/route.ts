import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { deleteCertificateFile } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/admin/students/[id]/delete
// Permanently removes a student and ALL owned records from the database.
// Requires ADMIN session. Cannot delete ADMIN users.
// Caller must confirm: JSON body { confirm: "DELETE" | registerNumber }
export async function DELETE(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Parse confirmation
  let body: { confirm?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Fetch target student
  const profile = await db.studentProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, role: true, email: true } },
      certificates: { select: { id: true, filePath: true } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Safety: never delete admin users
  if (profile.user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Only student accounts can be deleted." },
      { status: 403 }
    );
  }

  // Validate confirmation token
  const confirmValue = (body.confirm ?? "").trim().toUpperCase();
  const validConfirm =
    confirmValue === "DELETE" ||
    confirmValue === profile.registerNumber.toUpperCase();

  if (!validConfirm) {
    return NextResponse.json(
      {
        error: `Confirmation failed. Type "DELETE" or the student's register number to confirm.`,
      },
      { status: 422 }
    );
  }

  const adminId = session.userId;
  const deletedStudentId = id;
  const registerNumber = profile.registerNumber;
  const userId = profile.user.id;

  // ── Step 1: Cleanup Blob storage files ──────────────────────────────────
  await Promise.allSettled(
    profile.certificates
      .filter((c) => c.filePath)
      .map((c) => deleteCertificateFile(c.filePath))
  );

  // ── Step 2: Cascade delete in correct order inside a transaction ─────────
  // Note: AssessmentAnswer/AssessmentViolation cascade from AssessmentAttempt (onDelete: Cascade in schema)
  // Note: CourseProgress cascades from StudentSkill (onDelete: Cascade in schema)
  // Note: CertificateReview cascades from Certificate (onDelete: Cascade in schema)
  // We still delete ActivityLog and direct child models explicitly.
  await db.$transaction(async (tx) => {
    // Delete assessment violations (direct student relation)
    await tx.assessmentViolation.deleteMany({ where: { studentId: id } });

    // Delete certificate reviews via certificate IDs
    const certIds = profile.certificates.map((c) => c.id);
    if (certIds.length > 0) {
      await tx.certificateReview.deleteMany({
        where: { certificateId: { in: certIds } },
      });
    }

    // Delete certificates (AssessmentAnswers cascade from AssessmentAttempts, CertificateReviews from Certificates)
    await tx.certificate.deleteMany({ where: { studentId: id } });

    // Delete assessment attempts (AssessmentAnswers will cascade from schema)
    await tx.assessmentAttempt.deleteMany({ where: { studentId: id } });

    // Delete student skills (CourseProgress will cascade from schema)
    await tx.studentSkill.deleteMany({ where: { studentId: id } });

    // Delete activity logs for this student
    await tx.activityLog.deleteMany({ where: { studentId: id } });

    // Delete student profile
    await tx.studentProfile.delete({ where: { id } });

    // Delete user account
    await tx.user.delete({ where: { id: userId } });

    // ── Audit log on ADMIN account ─────────────────────────────────────────
    await tx.activityLog.create({
      data: {
        userId: adminId,
        action: "STUDENT_DELETED",
        metadata: { adminId, deletedStudentId, registerNumber },
      },
    });
  });

  return NextResponse.json(
    { ok: true, message: `Student ${registerNumber} permanently deleted.` },
    { status: 200 }
  );
}
