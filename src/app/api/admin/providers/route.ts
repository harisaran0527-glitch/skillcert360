import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { activeField, adminResult, catalogueError, catalogueSlug, optionalUrl, recordId, slugField } from "@/lib/catalog-admin";
const schema = z.object({ id: recordId, name: z.string().trim().min(2).max(120), slug: slugField.optional(), website: optionalUrl.default(""), description: z.string().trim().max(4000).default(""), active: activeField });
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) return adminResult(request, "/admin/providers", parsed.error.issues.map(i => i.message).join("; "));
  const { id, ...values } = parsed.data;
  const data = { ...values, slug: values.slug ?? catalogueSlug(values.name), website: values.website || null, officialWebsite: values.website || null, description: values.description || null };
  if (!slugField.safeParse(data.slug).success) return adminResult(request, "/admin/providers", "Provide a valid unique slug.");
  try {
    if (id) await db.provider.update({ where: { id }, data });
    else await db.provider.create({ data });
    return adminResult(request, "/admin/providers");
  } catch (error) { return adminResult(request, "/admin/providers", catalogueError(error)); }
}
