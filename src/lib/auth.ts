import { cache } from "react";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

const cookieName = "skillcert_session";
function sessionSecret() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

export type Session = { userId: string; role: UserRole; mustChangePassword: boolean };

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(sessionSecret());

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    if (typeof payload.userId !== "string" || (payload.role !== "ADMIN" && payload.role !== "STUDENT")) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { status: true, role: true, mustChangePassword: true },
    });
    if (!user || user.status !== "ACTIVE" || user.role !== payload.role) return null;
    return {
      userId: payload.userId,
      role: payload.role,
      mustChangePassword: user.mustChangePassword,
    };
  } catch {
    return null;
  }
});

export function getRoleLoginPath(role: UserRole) {
  return role === "ADMIN" ? "/admin/login" : "/student/login";
}

export function getRolePasswordPath(role: UserRole) {
  return role === "ADMIN" ? "/admin/password" : "/student/password";
}

export function getRoleDashboardPath(role: UserRole) {
  return role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";
}

export async function requireRole(role: UserRole) {
  const session = await getSession();
  if (!session || session.role !== role) redirect(getRoleLoginPath(role));
  return session;
}

export async function clearSession() {
  (await cookies()).delete(cookieName);
}

export function loginRedirect(role: UserRole, message = "") {
  return `${getRoleLoginPath(role)}${message ? `?error=${encodeURIComponent(message)}` : ""}`;
}
