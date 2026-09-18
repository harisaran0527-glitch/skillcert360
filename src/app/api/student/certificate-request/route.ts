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
        "Certificate request workflow has been retired. Upload your original provider certificate through SkillLocker.",
    },
    { status: 410 }
  );
}
