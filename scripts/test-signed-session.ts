import { SignJWT } from "jose";

async function main() {
  const baseUrl = "http://localhost:3000";
  const secretStr = process.env.SESSION_SECRET || "skillcert360-long-random-secret-value";
  const secret = new TextEncoder().encode(secretStr);

  // Admin user: cmtypsrrp0000wu4kriv2ws81
  const adminToken = await new SignJWT({
    userId: "cmtypsrrp0000wu4kriv2ws81",
    role: "ADMIN",
    mustChangePassword: false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

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

  async function benchmark(route: string, token: string, label: string) {
    const cookie = `skillcert_session=${token}`;
    
    // Cold request
    const t0 = Date.now();
    const res1 = await fetch(`${baseUrl}${route}`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    const cold = Date.now() - t0;
    const html1 = await res1.text();

    // Warm request
    const t1 = Date.now();
    const res2 = await fetch(`${baseUrl}${route}`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    const warm = Date.now() - t1;

    const isAuth = res1.status === 200 && !html1.includes("Redirecting") && !html1.includes("Sign in to your account");
    
    return {
      Route: route,
      "Authenticated?": isAuth ? "YES" : "NO",
      Cold: `${cold}ms`,
      Warm: `${warm}ms`,
      Status: `HTTP ${res1.status}`,
    };
  }

  const results = [];

  for (const route of ["/admin/dashboard", "/admin/students", "/admin/courses"]) {
    results.push(await benchmark(route, adminToken, "ADMIN"));
  }

  for (const route of ["/student/dashboard", "/student/skills", "/student/certificates"]) {
    results.push(await benchmark(route, studentToken, "STUDENT"));
  }

  console.table(results);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
