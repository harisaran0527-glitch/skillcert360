import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { deleteCertificateFile } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/admin/students/[id]/delete
// Permanently removes a student and ALL owned records from the database.
// Requires ADMIN session. Cannot delete ADMIN users.
// Caller must confirm: JSON body { confirm: "DELETE" | registerNumber }
//
// SAFETY ORDER:
//   1. DB transaction first — atomically purges all student records.
//   2. Blob storage cleanup AFTER successful commit.
//   Rationale: if DB fails we leave the student intact (recoverable).
//   If blob deletion fails after a successful DB commit, storage has
//   orphaned files (waste, not a data-integrity risk — no student record
//   references them anymore). This is the only failure-safe ordering.
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

  // Fetch target student (collect filePaths before deletion)
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

  // Collect blob storage keys BEFORE deletion (filePaths we'll clean up after commit)
  const blobKeys = profile.certificates
    .map((c) => c.filePath)
    .filter((fp): fp is string => !!fp);

  // ── Step 1: DB transaction (atomic — if this fails, student is untouched) ──
  // Note: AssessmentAnswer/AssessmentViolation cascade from AssessmentAttempt (onDelete: Cascade)
  // Note: CourseProgress cascades from StudentSkill (onDelete: Cascade)
  // Note: CertificateReview cascades from Certificate (onDelete: Cascade)
  await db.$transaction(async (tx) => {
    // Delete assessment violations (direct studentId relation)
    await tx.assessmentViolation.deleteMany({ where: { studentId: id } });

    // Delete certificate reviews via certificate IDs
    const certIds = profile.certificates.map((c) => c.id);
    if (certIds.length > 0) {
      await tx.certificateReview.deleteMany({
        where: { certificateId: { in: certIds } },
      });
    }

    // Delete certificates
    await tx.certificate.deleteMany({ where: { studentId: id } });

    // Delete assessment attempts (AssessmentAnswers cascade from schema)
    await tx.assessmentAttempt.deleteMany({ where: { studentId: id } });

    // Delete student skills (CourseProgress cascades from schema)
    await tx.studentSkill.deleteMany({ where: { studentId: id } });

    // Delete activity logs for this student
    await tx.activityLog.deleteMany({ where: { studentId: id } });

    // Delete student profile
    await tx.studentProfile.delete({ where: { id } });

    // Delete user account
    await tx.user.delete({ where: { id: userId } });

    // Audit log on ADMIN account
    await tx.activityLog.create({
      data: {
        userId: adminId,
        action: "STUDENT_DELETED",
        metadata: { adminId, deletedStudentId, registerNumber },
      },
    });
  });

  // ── Step 2: Blob storage cleanup AFTER successful DB commit ───────────────
  // If blob deletion fails, files are orphaned in storage but no DB record
  // references them — data integrity is preserved. Log failures but do NOT
  // fail the response (student is already fully deleted from DB).
  if (blobKeys.length > 0) {
    const blobResults = await Promise.allSettled(
      blobKeys.map((key) => deleteCertificateFile(key))
    );
    const blobFailures = blobResults.filter((r) => r.status === "rejected");
    if (blobFailures.length > 0) {
      console.error(
        `[delete-student] ${blobFailures.length}/${blobKeys.length} blob file(s) could not be deleted for deleted student ${registerNumber}. Orphaned storage keys:`,
        blobKeys
      );
    }
  }

  return NextResponse.json(
    { ok: true, message: `Student ${registerNumber} permanently deleted.` },
    { status: 200 }
  );
}
