import { z } from "zod";
import { db } from "@/lib/db";
import { studentTransaction, transition, WorkflowError } from "@/lib/workflow";

export const credentialSchema = z.object({
  skillId: z.string().cuid(),
  officialUrl: z.string().trim().max(500).refine(v => !v || /^https?:\/\//i.test(v) && URL.canParse(v), "Use an HTTP or HTTPS credential URL").optional(),
  credentialId: z.string().trim().max(150).optional(),
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v && new Date(v) <= new Date(), "Use a valid issue date, no later than today"),
}).strict().refine(v => !!v.officialUrl || !!v.credentialId, "Provide a credential URL or ID");

export async function submitCertificate(userId: string, data: z.infer<typeof credentialSchema>) {
  const student = await db.studentProfile.findUniqueOrThrow({ where: { userId } });
  return studentTransaction(student.id, async tx => {
    const passed = await tx.assessmentAttempt.findFirst({ where: { studentId: student.id, skillId: data.skillId, passed: true, submittedAt: { not: null } } });
    const certificate = await tx.certificate.findUnique({ where: { studentId_skillId: { studentId: student.id, skillId: data.skillId } } });
    if (!passed || !certificate || !["UNLOCKED", "REJECTED", "NEEDS_RESUBMISSION", "PENDING_SUBMISSION"].includes(certificate.status)) throw new WorkflowError("Certificate submission requires a passed assessment and an unlocked or returned certificate.");
    const details = { officialUrl: data.officialUrl || null, credentialId: data.credentialId || null, issuedAt: new Date(data.issuedAt) };
    await tx.certificate.update({ where: { id: certificate.id }, data: { ...details, status: "SUBMITTED", submittedAt: new Date(), verifiedAt: null, verifiedById: null, remarks: null } });
    await tx.certificateReview.create({ data: { certificateId: certificate.id, actorId: userId, status: "SUBMITTED", ...details } });
    await transition(tx, student.id, data.skillId, ["SUBMITTED", "PENDING_VERIFICATION"], { certificateId: certificate.id });
    return tx.certificate.update({ where: { id: certificate.id }, data: { status: "PENDING_VERIFICATION" } });
  });
}
export const reviewSchema = z.object({ certificateId: z.string().cuid(), status: z.enum(["VERIFIED", "REJECTED", "NEEDS_RESUBMISSION"]), remarks: z.string().trim().max(2000).default("") }).strict()
  .refine(v => v.status === "VERIFIED" || v.remarks.length > 0, "Provide remarks for rejection or resubmission");
export async function reviewCertificate(adminId: string, data: z.infer<typeof reviewSchema>) {
  const certificate = await db.certificate.findUnique({ where: { id: data.certificateId } });
  if (!certificate) throw new WorkflowError("Certificate not found", 404);
  return studentTransaction(certificate.studentId, async tx => {
    const current = await tx.certificate.findUniqueOrThrow({ where: { id: certificate.id } });
    if (current.status !== "PENDING_VERIFICATION") throw new WorkflowError("Only a pending submission can be reviewed.");
    const passed = await tx.assessmentAttempt.findFirst({ where: { studentId: current.studentId, skillId: current.skillId, passed: true } });
    if (!passed || (!current.officialUrl && !current.credentialId) || !current.issuedAt) throw new WorkflowError("A passed assessment and complete credential details are required.");
    const verifiedAt = data.status === "VERIFIED" ? new Date() : null;
    const updated = await tx.certificate.update({ where: { id: current.id }, data: { status: data.status, remarks: data.remarks || null, verifiedAt, verifiedById: verifiedAt ? adminId : null } });
    await tx.certificateReview.create({ data: { certificateId: current.id, actorId: adminId, status: data.status, remarks: data.remarks || null, officialUrl: current.officialUrl, credentialId: current.credentialId, issuedAt: current.issuedAt } });
    await tx.studentSkill.update({ where: { studentId_skillId: { studentId: current.studentId, skillId: current.skillId } }, data: { verifiedAt } });
    await transition(tx, current.studentId, current.skillId, [data.status], { certificateId: current.id, reviewedBy: adminId, remarks: data.remarks });
    return updated;
  });
}
