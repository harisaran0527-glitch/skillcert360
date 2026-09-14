import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { startAssessment } from "@/lib/assessment";
import { readBody, workflowResponse } from "@/lib/workflow";
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({ skillId: z.string().cuid() }).strict().safeParse(await readBody(request).catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid skill" }, { status: 400 });
  try {
    const profile = await db.studentProfile.findUniqueOrThrow({ where: { userId: session.userId } });
    const attempt = await startAssessment(profile.id, parsed.data.skillId);
    if (request.headers.get("content-type")?.includes("application/json")) return Response.json({ ok: true, redirect: `/student/assessment/${attempt.id}` });
    return NextResponse.redirect(new URL(`/student/assessment/${attempt.id}`, request.url), 303);
  } catch (error) { return workflowResponse(error); }
}
