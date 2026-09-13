import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { adminResult, catalogueError, courseSchema } from "@/lib/catalog-admin";
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const parsed = courseSchema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) return adminResult(request, "/admin/courses", parsed.error.issues.map(i => i.message).join("; "));
  const { id, ...values } = parsed.data;
  try {
    const error = await db.$transaction(async tx => {
      const skill = await tx.skill.findUnique({ where: { id: values.skillId } });
      if (!skill || skill.levelId !== values.levelId) return "Course level must match its skill level.";
      if (id) {
        const current = await tx.course.findUniqueOrThrow({ where: { id }, include: { _count: { select: { progress: true, selectedByStudentSkills: true, certificates: true } } } });
        if ((current.skillId !== values.skillId || current.providerId !== values.providerId) && Object.values(current._count).some(count => count > 0)) return "This course has student history. Create a new course mapping to change its skill or provider.";
      }
      const data = { ...values, title: values.name, officialUrl: values.officialUrl || "OFFICIAL_LINK_PENDING", duration: values.duration || null, isFree: values.pricingType === "FREE" || values.pricingType === "FREE_LEARNING_PAID_EXAM", certificateAvailable: values.credentialAvailable, verifiedAt: values.officialUrlStatus === "VERIFIED" ? new Date() : null };
      if (id) await tx.course.update({ where: { id }, data });
      else await tx.course.create({ data });
    });
    return adminResult(request, "/admin/courses", error);
  } catch (error) { return adminResult(request, "/admin/courses", catalogueError(error)); }
}
