import { productionSkillWhere } from "@/lib/production-ui";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { activeField, adminResult, catalogueError, catalogueSlug, recordId, slugField } from "@/lib/catalog-admin";
const schema = z.object({ id: recordId, name: z.string().trim().min(1).max(140), slug: slugField.optional(), categoryId: z.string().cuid(), levelId: z.string().cuid(), description: z.string().trim().max(3000).default(""), active: activeField });
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 140);
  const skills = await db.skill.findMany({ where: { AND: [productionSkillWhere], ...(query ? { name: { contains: query, mode: "insensitive" } } : {}) }, select: { id: true, name: true, level: { select: { name: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 30 });
  return Response.json({ skills });
}
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) return adminResult(request, "/admin/skills", parsed.error.issues.map(i => i.message).join("; "));
  const { id, ...values } = parsed.data;
  try {
    const error = await db.$transaction(async tx => {
      if (id) {
        const current = await tx.skill.findUniqueOrThrow({ where: { id }, include: { _count: { select: { courses: true, studentSkills: true, questions: true, attempts: true, certificates: true } } } });
        if (current.levelId !== values.levelId && Object.values(current._count).some(count => count > 0)) return "A skill with linked courses, questions or student history cannot change level. Create a separate skill definition.";
      }
      const data = { ...values, slug: values.slug ?? catalogueSlug(values.name), description: values.description || null };
      if (!slugField.safeParse(data.slug).success) return "Provide a valid unique slug.";
      if (id) await tx.skill.update({ where: { id }, data });
      else await tx.skill.create({ data });
    });
    return adminResult(request, "/admin/skills", error);
  } catch (error) { return adminResult(request, "/admin/skills", catalogueError(error)); }
}
