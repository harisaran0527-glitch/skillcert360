import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reviewSchema, reviewCertificate } from "@/lib/certificates";
import { readBody, workflowResponse } from "@/lib/workflow";
export async function POST(request: Request) {
 const session = await getSession();
 if (!session || session.mustChangePassword || session.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
 const parsed = reviewSchema.safeParse(await readBody(request).catch(() => null));
 if (!parsed.success) return Response.json({ error: parsed.error.issues.map(i => i.message).join("; ") }, { status: 400 });
 try {
  await reviewCertificate(session.userId, parsed.data);
  return NextResponse.redirect(new URL("/admin/certificates?success=1", request.url), 303);
 } catch (error) { return workflowResponse(error); }
}
