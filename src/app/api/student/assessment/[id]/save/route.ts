import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
export async function POST() {
  const session = await getSession();
  if (
    !session ||
    session.mustChangePassword ||
    session.role !== "STUDENT"
  ) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
  return NextResponse.json(
    {
      error:
        "The internal assessment system has been retired. Continue through SkillLocker and upload your original provider certificate.",
    },
    { status: 410 }
  );
}