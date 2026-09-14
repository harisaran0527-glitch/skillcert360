import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const baseUrl = "https://skillcert360.vercel.app";

  // Ensure test student has known password
  const hash = await bcrypt.hash("saran@2007", 12);
  await db.user.updateMany({
    where: { email: "saran.ad25@avsenggcollege.ac.in" },
    data: { passwordHash: hash, status: "ACTIVE" },
  });

  const form = new URLSearchParams();
  form.append("identifier", "saran.ad25@avsenggcollege.ac.in");
  form.append("password", "saran@2007");

  console.log("Logging into live production Vercel as Student...");
  const loginRes = await fetch(`${baseUrl}/api/auth/student/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    redirect: "manual",
  });

  const rawCookies = loginRes.headers.getSetCookie();
  const sessionCookieHeader = rawCookies.find(c => c.startsWith("skillcert_session="));
  if (!sessionCookieHeader) {
    console.error("Failed to acquire student session cookie from live Vercel");
    process.exit(1);
  }

  const cookie = sessionCookieHeader.split(";")[0];
  console.log("Acquired student session cookie successfully.");

  // Cold primer
  await fetch(`${baseUrl}/student/skills`, { headers: { Cookie: cookie }, redirect: "manual" });

  const runs: number[] = [];
  console.log("\nExecuting 5 warm benchmark runs on live Vercel /student/skills (sin1 region)...");

  for (let i = 1; i <= 5; i++) {
    const t0 = Date.now();
    const res = await fetch(`${baseUrl}/student/skills`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    const ms = Date.now() - t0;
    const text = await res.text();
    const isAuth = res.status === 200 && !text.includes("Sign in") && !text.includes("Redirecting");
    console.log(`Run ${i}: ${ms}ms (HTTP ${res.status}, Auth: ${isAuth ? "YES" : "NO"})`);
    if (isAuth) runs.push(ms);
    await new Promise(r => setTimeout(r, 200));
  }

  runs.sort((a, b) => a - b);
  if (runs.length > 0) {
    console.log("\n=== 5-RUN LIVE VERCEL /student/skills BENCHMARK SUMMARY ===");
    console.log(`min: ${runs[0]}ms`);
    console.log(`median: ${runs[Math.floor(runs.length / 2)]}ms`);
    console.log(`max: ${runs[runs.length - 1]}ms`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
