import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
const schema = z.object({
 assessmentQuestionCount: z.coerce.number().int().min(1).max(100),
 assessmentDurationMinutes: z.coerce.number().int().min(1).max(180),
 assessmentViolationLimit: z.coerce.number().int().min(1).max(100),
 assessmentCooldownHours: z.coerce.number().min(0).max(168),
});
export async function POST(request: Request) {
 const session = await getSession();
 if (!session || session.mustChangePassword || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
 const form = Object.fromEntries(await request.formData());
 const parsed = schema.safeParse(form);
 if (!parsed.success) return Response.json({ error: "Check settings values" }, { status: 400 });
 const levels = await db.skillLevel.findMany();
 const passMarks: Record<string, number> = {};
 for (const level of levels) {
  const value = Number(form[`passMarks.${level.name}`]);
  if (!Number.isInteger(value) || value < 1 || value > parsed.data.assessmentQuestionCount) return Response.json({ error: `${level.name} pass mark must be between 1 and the question count.` }, { status: 400 });
  passMarks[level.name] = value;
 }
 const values = { ...parsed.data, certificateRequirement: form.certificateRequirement === "on", autoSubmitOnViolation: form.autoSubmitOnViolation === "on", passMarksByLevel: passMarks };
 await db.$transaction(async tx => {
  for (const [key, value] of Object.entries(values)) await tx.adminSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  for (const level of levels) await tx.skillLevel.update({ where: { id: level.id }, data: { passMark: passMarks[level.name] } });
  await tx.activityLog.create({ data: { userId: session.userId, action: "SETTINGS_UPDATED", metadata: values } });
 });
 return NextResponse.redirect(new URL("/admin/settings?saved=1", request.url), 303);
}
