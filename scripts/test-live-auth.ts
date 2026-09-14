import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const baseUrl = "https://skillcert360.vercel.app";

  // 1. Admin Login POST
  const adminForm = new URLSearchParams();
  adminForm.append("identifier", "skillcertificate@gmail.com");
  adminForm.append("password", "saran@2007");

  const adminRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    redirect: "manual",
  });

  const cookies = adminRes.headers.getSetCookie();
  console.log("Raw cookies:", cookies);

  const sessionCookie = cookies.find(c => c.startsWith("skillcert_session="));
  console.log("Parsed session cookie:", sessionCookie ? sessionCookie.split(";")[0] : "NONE");

  if (sessionCookie) {
    const cookieHeader = sessionCookie.split(";")[0];
    for (const route of ["/admin/dashboard", "/admin/students", "/admin/courses"]) {
      const t0 = Date.now();
      const r1 = await fetch(`${baseUrl}${route}`, { headers: { Cookie: cookieHeader }, redirect: "manual" });
      const cold = Date.now() - t0;
      const html1 = await r1.text();

      const t1 = Date.now();
      const r2 = await fetch(`${baseUrl}${route}`, { headers: { Cookie: cookieHeader }, redirect: "manual" });
      const warm = Date.now() - t1;

      const isAuth = r1.status === 200 && !html1.includes("Redirecting") && !html1.includes("Sign in to your account");
      console.log(`ADMIN ${route} | Authenticated: ${isAuth ? "YES" : "NO"} | Cold: ${cold}ms | Warm: ${warm}ms | Status: HTTP ${r1.status}`);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
