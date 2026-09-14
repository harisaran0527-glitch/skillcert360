import { z } from "zod";
import { startAssessment } from "@/lib/assessment";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { readBody, studentTransaction, transition, WorkflowError, workflowResponse } from "@/lib/workflow";

const schema = z
  .object({
    skillId: z.string().cuid(),
    courseId: z.string().cuid(),
    completionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value =>
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && new Date(value) <= new Date(),
      "Use a valid completion date, no later than today."),
    declaration: z.literal(true),
  })
  .strict();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await readBody(request).catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "A valid completion date and completion declaration are required." }, { status: 400 });
  }

  try {
    const profile = await db.studentProfile.findUniqueOrThrow({
      where: { userId: session.userId },
      include: { user: true, department: true, section: true },
    });

    const { skillId, courseId, completionDate, declaration } = parsed.data;

    await studentTransaction(profile.id, async (tx) => {
      const enrollment = await tx.studentSkill.findUnique({
        where: { studentId_skillId: { studentId: profile.id, skillId } },
        include: { selectedCourse: { include: { provider: true } } },
      });

      if (!enrollment?.completedAt) {
        throw new WorkflowError("Complete official course learning before requesting a certificate.", 400);
      }

      const course = enrollment.selectedCourse;
      if (!course || course.id !== courseId || course.skillId !== skillId) {
        throw new WorkflowError("Request must match your selected course and its mapped skill.", 400);
      }
      const existing = await tx.certificate.findUnique({ where: { studentId_skillId: { studentId: profile.id, skillId } } });
      if (existing?.submittedAt || (existing && existing.status !== "LOCKED")) {
        throw new WorkflowError("A certificate request already exists. Continue to your assessment.");
      }
      const certificate = await tx.certificate.upsert({
        where: {
          studentId_skillId: { studentId: profile.id, skillId },
        },
        create: {
          studentId: profile.id,
          skillId,
          courseId: course.id,
          providerId: course.providerId,
          status: "LOCKED",
          submittedAt: new Date(),
          credentialName: course.title ?? course.name,
          credentialType: course.credentialType,
        },
        update: {
          courseId: course.id,
          providerId: course.providerId,
          status: "LOCKED",
          submittedAt: new Date(),
          credentialName: course.title ?? course.name,
          credentialType: course.credentialType,
        },
      });

      // Store the declaration in the existing durable audit record; no schema change.
      await transition(tx, profile.id, skillId, ["CERTIFICATE_REQUEST_SUBMITTED"], {
        certificateId: certificate.id, courseId: course.id, providerId: course.providerId,
        completionDate, declaration, studentName: profile.fullName, registerNumber: profile.registerNumber,
        courseName: course.title ?? course.name, providerName: course.provider.name,
      });
    });

    // Keep the request saved if the configured question bank or cooldown blocks starting.
    try {
      const attempt = await startAssessment(profile.id, skillId);
      return Response.json({ ok: true, redirect: `/student/assessment/${attempt.id}` });
    } catch (error) {
      return Response.json({ ok: true, requestSubmitted: true, assessmentError: error instanceof WorkflowError
        ? error.message : "Request saved. Unable to start the assessment; please retry." });
    }
  } catch (error) {
    return workflowResponse(error);
  }
}
