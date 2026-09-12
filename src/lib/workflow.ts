import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export class WorkflowError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
export type Tx = Prisma.TransactionClient;
// Every student workflow takes the same row lock, including starts and reviews.
// This serializes concurrent requests across processes, tabs and devices.
export async function studentTransaction<T>(studentId: string, work: (tx: Tx) => Promise<T>) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "StudentProfile" WHERE id = ${studentId} FOR UPDATE`;
    return work(tx);
  }, { maxWait: 15000, timeout: 20000 });
}
export async function transition(tx: Tx, studentId: string, skillId: string, states: string[], metadata: Prisma.InputJsonObject = {}) {
  for (const state of states) {
    await tx.studentSkill.update({ where: { studentId_skillId: { studentId, skillId } }, data: { state } });
    await tx.activityLog.create({ data: { studentId, action: state, metadata: { ...metadata, skillId } } });
  }
}
export function workflowResponse(error: unknown) {
  if (error instanceof WorkflowError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Workflow failure", error);
  return Response.json({ error: "Unable to complete the request. Please retry." }, { status: 500 });
}
export async function readBody(request: Request) {
  return request.headers.get("content-type")?.includes("application/json") ? request.json() : Object.fromEntries(await request.formData());
}
