import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(140),
  categoryId: z.string().cuid(),
  levelId: z.string().cuid(),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
});

export async function POST(request: Request) {
 const session = await getSession();
 if (!session || session.mustChangePassword || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const form = Object.fromEntries(await request.formData());
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin/skills?error=Check skill details", request.url), 303);
  }

  const { name, categoryId, levelId, description } = parsed.data;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "skill";

  await db.skill.upsert({
    where: { slug },
    update: { categoryId, levelId, description: description || null, active: true },
    create: { name, slug, categoryId, levelId, description: description || null },
  });

  return NextResponse.redirect(new URL("/admin/skills", request.url), 303);
}
