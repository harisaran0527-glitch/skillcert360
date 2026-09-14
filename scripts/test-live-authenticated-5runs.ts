async function main() {
  const baseUrl = "https://skillcert360.vercel.app";

  const form = new URLSearchParams();
  form.append("identifier", "skillcertificate@gmail.com");
  form.append("password", "saran@2007");

  console.log("Logging into live production Vercel...");
  const loginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    redirect: "manual",
  });

  console.log("Login HTTP Status:", loginRes.status);
  const rawCookies = loginRes.headers.getSetCookie();
  console.log("Set-Cookie headers:", rawCookies);

  const sessionCookieHeader = rawCookies.find(c => c.startsWith("skillcert_session="));
  if (!sessionCookieHeader) {
    console.error("Failed to acquire session cookie from live Vercel");
    process.exit(1);
  }

  const cookie = sessionCookieHeader.split(";")[0];
  console.log("Acquired session cookie:", cookie);

  // 1 Cold primer
  await fetch(`${baseUrl}/admin/skills`, { headers: { Cookie: cookie }, redirect: "manual" });

  const runs: number[] = [];
  console.log("\nExecuting 5 warm benchmark runs on live Vercel (sin1 region)...");

  for (let i = 1; i <= 5; i++) {
    const t0 = Date.now();
    const res = await fetch(`${baseUrl}/admin/skills`, {
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
    console.log("\n=== 5-RUN LIVE VERCEL BENCHMARK SUMMARY ===");
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
