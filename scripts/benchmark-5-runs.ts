import { SignJWT } from "jose";

async function main() {
  const baseUrl = "https://skillcert360.vercel.app";
  const secret = new TextEncoder().encode("skillcert360-long-random-secret-value");

  // Student user: cmu119csr0004lb04q9p5a32z
  const studentToken = await new SignJWT({
    userId: "cmu119csr0004lb04q9p5a32z",
    role: "STUDENT",
    mustChangePassword: false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  const cookie = `skillcert_session=${studentToken}`;

  // 1 Cold primer
  await fetch(`${baseUrl}/student/skills`, { headers: { Cookie: cookie }, redirect: "manual" });

  const runs: number[] = [];

  console.log("Executing 5 warm benchmark runs on live production /student/skills...");

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
    runs.push(ms);
    await new Promise(r => setTimeout(r, 200));
  }

  runs.sort((a, b) => a - b);
  const min = runs[0];
  const median = runs[2];
  const max = runs[4];

  console.log("\n=== 5-RUN BENCHMARK SUMMARY ===");
  console.log(`min: ${min}ms`);
  console.log(`median: ${median}ms`);
  console.log(`max: ${max}ms`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
