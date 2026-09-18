import { z } from "zod";
import { db } from "@/lib/db";
import { WorkflowError } from "@/lib/workflow";

export const reviewSchema = z
  .object({
    certificateId: z.string().cuid(),
    status: z.enum([
      "VERIFIED",
      "REJECTED",
      "NEEDS_RESUBMISSION",
    ]),
    remarks: z.string().trim().max(2000).default(""),
  })
  .strict()
  .refine(
    (data) =>
      data.status === "VERIFIED" ||
      data.remarks.length > 0,
    "Provide a reason for rejection or resubmission"
  );

export async function reviewCertificate(
  adminId: string,
  data: z.infer<typeof reviewSchema>
) {
  const certificate = await db.certificate.findUnique({
    where: {
      id: data.certificateId,
    },
  });

  if (!certificate) {
    throw new WorkflowError(
      "Certificate not found",
      404
    );
  }

  if (certificate.status !== "PENDING_VERIFICATION") {
    throw new WorkflowError(
      "Only certificates pending verification can be reviewed.",
      400
    );
  }

  if (!certificate.filePath) {
    throw new WorkflowError(
      "Original certificate file is missing.",
      400
    );
  }

  if (!certificate.courseId) {
    throw new WorkflowError(
      "Certificate course information is missing.",
      400
    );
  }

  if (!certificate.providerId) {
    throw new WorkflowError(
      "Certificate provider information is missing.",
      400
    );
  }

  if (!certificate.certificateTitle) {
    throw new WorkflowError(
      "Certificate title is missing.",
      400
    );
  }

  const originalIssueDate =
    certificate.issueDate ?? certificate.issuedAt;

  if (!originalIssueDate) {
    throw new WorkflowError(
      "Certificate issue date is missing.",
      400
    );
  }

  const verifiedAt =
    data.status === "VERIFIED"
      ? new Date()
      : null;

  const rejectionReason =
    data.status === "VERIFIED"
      ? null
      : data.remarks || null;

  return db.$transaction(async (tx) => {
    const current = await tx.certificate.findUnique({
      where: {
        id: certificate.id,
      },
    });

    if (!current) {
      throw new WorkflowError(
        "Certificate not found",
        404
      );
    }

    if (current.status !== "PENDING_VERIFICATION") {
      throw new WorkflowError(
        "Certificate has already been reviewed.",
        400
      );
    }

    const updatedCertificate =
      await tx.certificate.update({
        where: {
          id: current.id,
        },
        data: {
          status: data.status,

          remarks:
            data.remarks || null,

          rejectionReason,

          verifiedAt,

          verifiedById:
            data.status === "VERIFIED"
              ? adminId
              : null,
        },
      });

    await tx.certificateReview.create({
      data: {
        certificateId: current.id,
        actorId: adminId,

        status: data.status,

        remarks:
          data.remarks || null,

        officialUrl:
          current.credentialUrl ??
          current.officialUrl ??
          null,

        credentialId:
          current.credentialId,

        filePath:
          current.filePath,

        originalFileName:
          current.originalFileName,

        mimeType:
          current.mimeType,

        fileSize:
          current.fileSize,

        issuedAt: originalIssueDate,
      },
    });

    if (data.status === "VERIFIED") {
      await tx.studentSkill.updateMany({
        where: {
          studentId: current.studentId,
          skillId: current.skillId,
        },
        data: {
          verifiedAt,
        },
      });
    }

    return updatedCertificate;
  });
}