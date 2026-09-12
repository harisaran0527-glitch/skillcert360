import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
});

export async function POST(request: Request) {
 const session = await getSession();
 if (!session || session.mustChangePassword || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const form = Object.fromEntries(await request.formData());
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin/departments?error=Check department name", request.url), 303);
  }

  const name = parsed.data.name.trim();

  await db.department.upsert({
    where: { name },
    update: { active: true },
    create: { name },
  });

  return NextResponse.redirect(new URL("/admin/departments", request.url), 303);
}
