import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(180),
  skillId: z.string().cuid(),
  providerId: z.string().cuid(),
  levelId: z.string().cuid(),
  officialUrl: z.string().trim().max(400).optional().or(z.literal("")),
});

export async function POST(request: Request) {
 const session = await getSession();
 if (!session || session.mustChangePassword || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const form = Object.fromEntries(await request.formData());
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin/courses?error=Check course details", request.url), 303);
  }

  const { name, skillId, providerId, levelId, officialUrl } = parsed.data;

  await db.course.create({
    data: {
      name,
      skillId,
      providerId,
      levelId,
      officialUrl: officialUrl || "OFFICIAL_LINK_PENDING",
      isFree: true,
      certificateAvailable: false,
      description: "",
      durationMinutes: 60,
      active: true,
    },
  });

  return NextResponse.redirect(new URL("/admin/courses", request.url), 303);
}
