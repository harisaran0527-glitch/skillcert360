import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { readBody, studentTransaction, transition, WorkflowError, workflowResponse } from "@/lib/workflow";
import { assertSkillLevelUnlocked } from "@/lib/progression";
import { availableCourseWhere } from "@/lib/catalog";
const schema = z.object({ skillId: z.string().cuid(), courseId: z.string().cuid().optional(), action: z.enum(["learn", "complete"]) }).strict();
export async function POST(request: Request) {
 const session = await getSession();
 if (!session || session.mustChangePassword || session.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });
 const parsed = schema.safeParse(await readBody(request).catch(() => null));
 if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
 try {
  const profile = await db.studentProfile.findUniqueOrThrow({ where: { userId: session.userId } });
  const { skillId, courseId, action } = parsed.data;
  await studentTransaction(profile.id, async tx => {
   const skill = await tx.skill.findFirst({ where: { id: skillId, category: { active: true }, level: { active: true } } });
   if (!skill?.active) throw new WorkflowError("Skill unavailable", 404);
   // Level-lock: reject learning actions for locked levels server-side.
   await assertSkillLevelUnlocked(profile.id, skillId);
   let enrollment = await tx.studentSkill.findUnique({ where: { studentId_skillId: { studentId: profile.id, skillId } } });
   if (action === "learn") {
    const course = await tx.course.findFirst({ where: { ...availableCourseWhere, id: courseId ?? "", skillId } });
    if (!course || !/^https?:\/\//i.test(course.officialUrl) || !URL.canParse(course.officialUrl) || course.officialUrl.includes("official-provider.org")) throw new WorkflowError("Select an active official course", 400);
    if (!enrollment) { enrollment = await tx.studentSkill.create({ data: { studentId: profile.id, skillId } }); await transition(tx, profile.id, skillId, ["LEARNING"]); }
    if (enrollment.selectedCourseId !== course.id) {
     if (enrollment.completedAt || await tx.assessmentAttempt.count({ where: { studentId: profile.id, skillId } })) throw new WorkflowError("The selected course cannot change after learning is completed or assessment has started.");
     await tx.studentSkill.update({ where: { id: enrollment.id }, data: { selectedCourseId: course.id } });
    }
    await tx.courseProgress.upsert({ where: { studentSkillId_courseId: { studentSkillId: enrollment.id, courseId: course.id } }, create: { studentSkillId: enrollment.id, courseId: course.id }, update: {} });
    await tx.activityLog.create({ data: { studentId: profile.id, action: "OFFICIAL_COURSE_OPENED", metadata: { skillId, courseId: course.id, providerId: course.providerId } } });
   } else {
    if (!enrollment) throw new WorkflowError("Start an official course first.");
    if (enrollment.completedAt) return;
    if (!enrollment.selectedCourseId || !await tx.courseProgress.count({ where: { studentSkillId: enrollment.id, courseId: enrollment.selectedCourseId } })) throw new WorkflowError("Choose and open an official course before marking learning complete.");
    await tx.courseProgress.updateMany({ where: { studentSkillId: enrollment.id, courseId: enrollment.selectedCourseId }, data: { completedAt: new Date() } });
    await tx.studentSkill.update({ where: { id: enrollment.id }, data: { completedAt: new Date() } });
    await transition(tx, profile.id, skillId, ["LEARNING_COMPLETED"]);
   }
  });
  const destination = new URL("/student/skills", request.url);
  const referer = request.headers.get("referer");
  if (referer && URL.canParse(referer)) {
   const previous = new URL(referer);
   if (previous.origin === destination.origin && (previous.pathname === "/student/skills" || previous.pathname.startsWith("/student/skills/") || previous.pathname === "/student/my-learning")) {
    destination.pathname = previous.pathname;
    destination.search = previous.search;
   }
  }
  if (action === "complete") {
   destination.pathname = "/student/certificates";
   destination.search = "";
  }
  return request.headers.get("content-type")?.includes("application/json") ? Response.json({ ok: true, redirect: action === "complete" ? destination.pathname : undefined }) : NextResponse.redirect(destination, 303);
 } catch (error) { return workflowResponse(error); }
}
