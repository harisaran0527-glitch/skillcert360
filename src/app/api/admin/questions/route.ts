import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  skillId: z.string().cuid(),
  levelId: z.string().cuid(),
  type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  prompt: z.string().trim().min(3).max(3000),
  options: z.string().trim().min(3).max(6000),
  correctAnswer: z.string().trim().min(1).max(500),
  explanation: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = Object.fromEntries(await request.formData());
  const parsed = schema.safeParse(form);
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin/questions?error=Check the question details", request.url), 303);
  }

  const { skillId, levelId, type, difficulty, prompt, options, correctAnswer, explanation } = parsed.data;
  const cleanedOptions = options
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const skill = await db.skill.findFirst({ where: { id: skillId, levelId } });
  const expected = type === "MULTIPLE_CHOICE" ? correctAnswer.split(/\r?\n|\|/).map(v => v.trim()).filter(Boolean) : correctAnswer;
  if (!skill || (type === "TRUE_FALSE" ? !["true", "false"].includes(correctAnswer.toLowerCase()) : (cleanedOptions.length < 2 || (Array.isArray(expected) ? expected.some(v => !cleanedOptions.includes(v)) : !cleanedOptions.includes(expected))))) {
    return Response.json({ error: "Match the skill level and select correct answers from the options. For multiple choice separate correct options with |." }, { status: 400 });
  }

  await db.question.create({
    data: {
      skillId,
      levelId,
      type,
      difficulty,
      prompt,
      options: cleanedOptions,
      correctAnswer: type === "TRUE_FALSE" ? correctAnswer.toLowerCase() === "true" : expected,
      explanation: explanation || null,
      active: true,
    },
  });

  return NextResponse.redirect(new URL("/admin/questions", request.url), 303);
}
