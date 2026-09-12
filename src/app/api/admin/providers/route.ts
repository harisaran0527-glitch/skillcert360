import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const form = Object.fromEntries(await request.formData());
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin/providers?error=Check provider details", request.url), 303);
  }

  const { name, website, description } = parsed.data;

  await db.provider.upsert({
    where: { name },
    update: { website: website || null, description: description || null, active: true },
    create: { name, website: website || null, description: description || null },
  });

  return NextResponse.redirect(new URL("/admin/providers", request.url), 303);
}
