import { z } from "zod";
import { getSession } from "@/lib/auth";
import { assessmentAction, clientSchema, responsesSchema, violationTypes } from "@/lib/assessment";
import { workflowResponse } from "@/lib/workflow";
const schema = z.object({ clientId: clientSchema, responses: responsesSchema.optional(), types: z.array(violationTypes).min(1).max(4).optional() }).strict();
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.mustChangePassword || session.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });
  try {
    const { id } = await params;
    
    return Response.json(await assessmentAction(session.userId, id, parsed.data.clientId, "heartbeat", parsed.data.responses, parsed.data.types), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return workflowResponse(error); }
}
