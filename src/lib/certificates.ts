import { z } from "zod";
import { db } from "@/lib/db";
import { studentTransaction, transition, WorkflowError } from "@/lib/workflow";
import {
  isStorageConfigured,
  uploadCertificateFile,
  deleteCertificateFile,
  validateCertificateFile,
} from "@/lib/storage";

export const credentialSchema = z
  .object({
    skillId: z.string().cuid(),
    officialUrl: z
      .string()
      .trim()
      .max(500)
      .refine(
        (v) => !v || (/^https?:\/\//i.test(v) && URL.canParse(v)),
        "Use a valid HTTP or HTTPS credential URL"
      )
      .optional(),
    credentialId: z.string().trim().max(150).optional(),
    issuedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) =>
          Number.isFinite(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v &&
          new Date(v) <= new Date(),
        "Use a valid issue date, no later than today"
      ),
    file: z
      .object({
        name: z.string(),
        buffer: z.instanceof(Buffer),
        mimeType: z.string(),
      })
      .optional(),
  })
  .strict()
  .refine(
    (v) => !!v.officialUrl || !!v.credentialId || !!v.file,
    "Provide credential evidence (Credential ID + URL, File + ID, or File + URL)."
  );

export type SubmitCertificateInput = z.infer<typeof credentialSchema>;

export async function submitCertificate(userId: string, data: SubmitCertificateInput) {
  const student = await db.studentProfile.findUniqueOrThrow({ where: { userId } });

  // 1. Initial pre-check outside transaction
  const passed = await db.assessmentAttempt.findFirst({
    where: { studentId: student.id, skillId: data.skillId, passed: true, submittedAt: { not: null } },
  });
  const certificate = await db.certificate.findUnique({
    where: { studentId_skillId: { studentId: student.id, skillId: data.skillId } },
  });

  if (!passed || !certificate || !["UNLOCKED", "REJECTED", "NEEDS_RESUBMISSION", "PENDING_SUBMISSION"].includes(certificate.status)) {
    throw new WorkflowError(
      "Certificate submission requires a passed assessment and an unlocked or returned certificate."
    );
  }

  // 2. Handle File Upload if file provided
  let uploadResult: {
    storageKey: string;
    fileUrl: string;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    storageProvider: string;
  } | null = null;

  if (data.file) {
    const validation = validateCertificateFile(data.file);
    if (!validation.valid) {
      throw new WorkflowError(validation.error || "Invalid certificate file.", 400);
    }

    if (!isStorageConfigured()) {
      throw new WorkflowError(
        "External file storage is not configured. Please submit via Credential URL and Credential ID.",
        400
      );
    }

    uploadResult = await uploadCertificateFile({
      studentId: student.id,
      certificateId: certificate.id,
      file: data.file,
    });
  }

  // 3. Evidence sufficiency check (Option A, B, C, D)
  const hasUrl = !!data.officialUrl;
  const hasId = !!data.credentialId;
  const hasFile = !!uploadResult || !!certificate.filePath;

  const hasSufficientEvidence = (hasUrl && hasId) || (hasFile && hasId) || (hasFile && hasUrl);
  if (!hasSufficientEvidence) {
    // If we uploaded a file but evidence is insufficient, clean up the newly uploaded file
    if (uploadResult) {
      await deleteCertificateFile(uploadResult.storageKey);
    }
    throw new WorkflowError(
      "Provide sufficient credential evidence (Credential ID + URL, File + ID, or File + URL).",
      400
    );
  }

  const oldFilePath = certificate.filePath;

  // 4. Update Database safely in transaction
  const result = await studentTransaction(student.id, async (tx) => {
    const current = await tx.certificate.findUniqueOrThrow({ where: { id: certificate.id } });
    if (!["UNLOCKED", "REJECTED", "NEEDS_RESUBMISSION", "PENDING_SUBMISSION"].includes(current.status)) {
      throw new WorkflowError("Certificate is not eligible for submission.");
    }

    const details = {
      officialUrl: data.officialUrl || current.officialUrl || null,
      credentialId: data.credentialId || current.credentialId || null,
      issuedAt: new Date(data.issuedAt),
      filePath: uploadResult ? uploadResult.storageKey : current.filePath,
      originalFileName: uploadResult ? uploadResult.originalFileName : current.originalFileName,
      mimeType: uploadResult ? uploadResult.mimeType : current.mimeType,
      fileSize: uploadResult ? uploadResult.fileSize : current.fileSize,
      uploadedAt: uploadResult ? new Date() : current.uploadedAt,
      storageProvider: uploadResult ? uploadResult.storageProvider : current.storageProvider,
    };

    await tx.certificate.update({
      where: { id: current.id },
      data: {
        ...details,
        status: "SUBMITTED",
        submittedAt: new Date(),
        verifiedAt: null,
        verifiedById: null,
        remarks: null,
      },
    });

    await tx.certificateReview.create({
      data: {
        certificateId: current.id,
        actorId: userId,
        status: "SUBMITTED",
        officialUrl: details.officialUrl,
        credentialId: details.credentialId,
        filePath: details.filePath,
        originalFileName: details.originalFileName,
        mimeType: details.mimeType,
        fileSize: details.fileSize,
        issuedAt: details.issuedAt,
      },
    });

    await transition(tx, student.id, data.skillId, ["SUBMITTED", "PENDING_VERIFICATION"], {
      certificateId: current.id,
      hasFile: !!details.filePath,
    });

    return tx.certificate.update({
      where: { id: current.id },
      data: { status: "PENDING_VERIFICATION" },
    });
  });

  // 5. Post-transaction: Safe obsolete file cleanup
  if (oldFilePath && uploadResult && oldFilePath !== uploadResult.storageKey) {
    await deleteCertificateFile(oldFilePath);
  }

  return result;
}

export const reviewSchema = z
  .object({
    certificateId: z.string().cuid(),
    status: z.enum(["VERIFIED", "REJECTED", "NEEDS_RESUBMISSION"]),
    remarks: z.string().trim().max(2000).default(""),
  })
  .strict()
  .refine(
    (v) => v.status === "VERIFIED" || v.remarks.length > 0,
    "Provide remarks for rejection or resubmission"
  );

export async function reviewCertificate(adminId: string, data: z.infer<typeof reviewSchema>) {
  const certificate = await db.certificate.findUnique({ where: { id: data.certificateId } });
  if (!certificate) throw new WorkflowError("Certificate not found", 404);

  return studentTransaction(certificate.studentId, async (tx) => {
    const current = await tx.certificate.findUniqueOrThrow({ where: { id: certificate.id } });
    if (current.status !== "PENDING_VERIFICATION") {
      throw new WorkflowError("Only a pending submission can be reviewed.");
    }

    const passed = await tx.assessmentAttempt.findFirst({
      where: { studentId: current.studentId, skillId: current.skillId, passed: true },
    });

    const hasUrl = !!current.officialUrl;
    const hasId = !!current.credentialId;
    const hasFile = !!current.filePath;
    const hasEvidence = (hasUrl && hasId) || (hasFile && hasId) || (hasFile && hasUrl);

    if (!passed || !hasEvidence || !current.issuedAt) {
      throw new WorkflowError("A passed assessment and complete credential evidence are required.");
    }

    const verifiedAt = data.status === "VERIFIED" ? new Date() : null;
    const updated = await tx.certificate.update({
      where: { id: current.id },
      data: {
        status: data.status,
        remarks: data.remarks || null,
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
        issuedAt: current.issuedAt,
      },
    });

    await tx.studentSkill.update({
      where: { studentId_skillId: { studentId: current.studentId, skillId: current.skillId } },
      data: { verifiedAt },
    });

    await transition(tx, current.studentId, current.skillId, [data.status], {
      certificateId: current.id,
      reviewedBy: adminId,
      remarks: data.remarks,
    });

    return updated;
  });
}
