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
        "Old certificate submission workflow is no longer available. Use SkillLocker certificate upload.",
    },
    { status: 410 }
  );
}
