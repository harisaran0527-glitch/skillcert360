import { SignJWT } from "jose";
import { db } from "../src/lib/db";

async function main() {
  const admin = await db.user.findFirst({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true, email: true },
  });

  const studentProfile = await db.studentProfile.findFirst({
    where: { user: { status: "ACTIVE" } },
    select: { userId: true, user: { select: { email: true } } },
  });

  if (!admin || !studentProfile) {
    console.error("Missing test users");
    process.exit(1);
  }

  const secretStr = process.env.SESSION_SECRET || "default_secret_that_is_at_least_32_characters_long_for_hs256";
  const secret = new TextEncoder().encode(secretStr);

  const adminToken = await new SignJWT({
    userId: admin.id,
    role: "ADMIN",
    mustChangePassword: false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  const studentToken = await new SignJWT({
    userId: studentProfile.userId,
    role: "STUDENT",
    mustChangePassword: false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  const baseUrl = "https://skillcert360.vercel.app";

  async function testRoute(route: string, cookie: string, label: string) {
    const url = baseUrl + route;
    
    // Cold request
    const start1 = Date.now();
    const res1 = await fetch(url, {
      headers: { Cookie: `skillcert_session=${cookie}` },
      redirect: "manual",
    });
    const duration1 = Date.now() - start1;
    const body1 = await res1.text();
    const isAuth1 = res1.status === 200 && !body1.includes("Sign in to your account") && !body1.includes("Redirecting");

    // Warm request
    const start2 = Date.now();
    const res2 = await fetch(url, {
      headers: { Cookie: `skillcert_session=${cookie}` },
      redirect: "manual",
    });
    const duration2 = Date.now() - start2;
    const body2 = await res2.text();
    const isAuth2 = res2.status === 200 && !body2.includes("Sign in to your account") && !body2.includes("Redirecting");

    return {
      route,
      role: label,
      authenticated: isAuth1 && isAuth2 ? "YES" : "NO",
      cold: `${duration1}ms`,
      warm: `${duration2}ms`,
      status: `HTTP ${res1.status}`,
      coldMs: duration1,
      warmMs: duration2,
    };
  }

  console.log("Measuring live authenticated production routes...\n");

  const results = [
    await testRoute("/admin/dashboard", adminToken, "ADMIN"),
    await testRoute("/admin/students", adminToken, "ADMIN"),
    await testRoute("/admin/courses", adminToken, "ADMIN"),
    await testRoute("/student/dashboard", studentToken, "STUDENT"),
    await testRoute("/student/skills", studentToken, "STUDENT"),
    await testRoute("/student/certificates", studentToken, "STUDENT"),
  ];

  console.table(results.map(r => ({
    Route: r.route,
    "Authenticated?": r.authenticated,
    Cold: r.cold,
    Warm: r.warm,
    Status: r.status,
  })));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
