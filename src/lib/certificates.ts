import { z } from "zod";
import { db } from "@/lib/db";
import { studentTransaction, WorkflowError } from "@/lib/workflow";

export const reviewSchema = z
  .object({
    certificateId: z.string().cuid(),
    status: z.enum(["VERIFIED", "REJECTED", "NEEDS_RESUBMISSION"]),
    remarks: z.string().trim().max(2000).default(""),
  })
  .strict()
  .refine(
    (v) => v.status === "VERIFIED" || v.remarks.length > 0,
    "Provide remarks/reason for rejection or resubmission"
  );

export async function reviewCertificate(adminId: string, data: z.infer<typeof reviewSchema>) {
  const certificate = await db.certificate.findUnique({ where: { id: data.certificateId } });
  if (!certificate) throw new WorkflowError("Certificate not found", 404);

  return studentTransaction(certificate.studentId, async (tx) => {
    const current = await tx.certificate.findUniqueOrThrow({ where: { id: certificate.id } });
    if (current.status !== "PENDING_VERIFICATION") {
      throw new WorkflowError("Only a PENDING_VERIFICATION submission can be reviewed.");
    }

    if (!current.filePath) {
      throw new WorkflowError("Original certificate file is required for verification.");
    }

    if (!current.courseId) {
      throw new WorkflowError("Course selection is required for verification.");
    }

    if (!current.providerId) {
      throw new WorkflowError("Provider is required for verification.");
    }

    if (!current.certificateTitle) {
      throw new WorkflowError("Certificate title is required for verification.");
    }

    if (!current.issueDate) {
      throw new WorkflowError("Issue date is required for verification.");
    }

    const verifiedAt = data.status === "VERIFIED" ? new Date() : null;
    const updated = await tx.certificate.update({
      where: { id: current.id },
      data: {
        status: data.status,
        remarks: data.remarks || null,
        rejectionReason: data.status !== "VERIFIED" ? (data.remarks || null) : null,
        verifiedAt,
        verifiedById: verifiedAt ? adminId : null,
      },
    });

    await tx.certificateReview.create({
      data: {
        certificateId: current.id,
        actorId: adminId,
        status: data.status,
        remarks: data.remarks || null,
        officialUrl: current.officialUrl,
        credentialId: current.credentialId,
        filePath: current.filePath,
        originalFileName: current.originalFileName,
        mimeType: current.mimeType,
        fileSize: current.fileSize,
        issuedAt: current.issueDate,
      },
    });

    const studentSkill = await tx.studentSkill.findFirst({
      where: { studentId: current.studentId, skillId: current.skillId },
    });
    if (studentSkill) {
      await tx.studentSkill.update({
        where: { id: studentSkill.id },
        data: {
          verifiedAt: data.status === "VERIFIED" ? (studentSkill.verifiedAt || new Date()) : studentSkill.verifiedAt,
          state: data.status === "VERIFIED" ? "VERIFIED" : studentSkill.state,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        studentId: current.studentId,
        action: `CERTIFICATE_${data.status}`,
        metadata: {
          certificateId: current.id,
          skillId: current.skillId,
          reviewedBy: adminId,
          remarks: data.remarks,
        },
      },
    });

    return updated;
  });
}
