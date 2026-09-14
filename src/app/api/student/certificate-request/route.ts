import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { readBody, studentTransaction, WorkflowError, workflowResponse } from "@/lib/workflow";

const schema = z
  .object({
    skillId: z.string().cuid(),
    courseId: z.string().cuid(),
    remarks: z.string().max(500).optional(),
  })
  .strict();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await readBody(request).catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request data" }, { status: 400 });
  }

  try {
    const profile = await db.studentProfile.findUniqueOrThrow({
      where: { userId: session.userId },
      include: { user: true, department: true, section: true },
    });

    const { skillId, courseId, remarks } = parsed.data;

    await studentTransaction(profile.id, async (tx) => {
      const enrollment = await tx.studentSkill.findUnique({
        where: { studentId_skillId: { studentId: profile.id, skillId } },
        include: { selectedCourse: { include: { provider: true } } },
      });

      if (!enrollment?.completedAt) {
        throw new WorkflowError("Complete official course learning before requesting a certificate.", 400);
      }

      const course = await tx.course.findUnique({
        where: { id: courseId },
        include: { provider: true },
      });

      if (!course) {
        throw new WorkflowError("Course not found.", 404);
      }

      // Upsert Certificate record in SUBMITTED / PENDING_SUBMISSION status
      // NOTE: Certificate status remains LOCKED until student passes the assessment!
      await tx.certificate.upsert({
        where: {
          studentId_skillId: { studentId: profile.id, skillId },
        },
        create: {
          studentId: profile.id,
          skillId,
          courseId: course.id,
          providerId: course.providerId,
          status: "SUBMITTED",
          submittedAt: new Date(),
          remarks: remarks || `Certificate Request submitted for ${course.name}`,
        },
        update: {
          courseId: course.id,
          providerId: course.providerId,
          status: "SUBMITTED",
          submittedAt: new Date(),
          remarks: remarks || `Certificate Request submitted for ${course.name}`,
        },
      });

      await tx.activityLog.create({
        data: {
          studentId: profile.id,
          action: "CERTIFICATE_REQUEST_SUBMITTED",
          metadata: {
            skillId,
            courseId: course.id,
            providerId: course.providerId,
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    const referer = request.headers.get("referer");
    if (referer && URL.canParse(referer)) {
      return NextResponse.redirect(referer, 303);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return workflowResponse(error);
  }
}
