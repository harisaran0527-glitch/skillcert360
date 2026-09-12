import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { credentialSchema, submitCertificate } from "@/lib/certificates";
import { readBody, workflowResponse } from "@/lib/workflow";
export async function POST(request: Request) {
 const session = await getSession();
 if (!session || session.mustChangePassword || session.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });
 const parsed = credentialSchema.safeParse(await readBody(request).catch(() => null));
 if (!parsed.success) return Response.json({ error: parsed.error.issues.map(i => i.message).join("; ") }, { status: 400 });
 try {
  await submitCertificate(session.userId, parsed.data);
  return NextResponse.redirect(new URL("/student/certificates?success=1", request.url), 303);
 } catch (error) { return workflowResponse(error); }
}
