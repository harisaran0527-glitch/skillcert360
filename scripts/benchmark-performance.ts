import "dotenv/config";

const BASE_URL = process.env.BENCHMARK_BASE_URL || "https://skillcert360.vercel.app";

async function measureRoute(path: string, options: RequestInit = {}): Promise<number> {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "User-Agent": "SkillCert360-Benchmarker",
        ...(options.headers || {}),
      },
    });
    await res.text();
    const duration = performance.now() - start;
    return Math.round(duration);
  } catch (err) {
    console.error(`Error fetching ${path}:`, err);
    return -1;
  }
}

async function benchmark() {
  console.log(`=== BENCHMARKING RESPONSE TIMES (${BASE_URL}) ===\n`);

  const publicRoutes = [
    "/",
    "/student/login",
    "/admin/login",
    "/skills",
  ];

  console.log("--- PUBLIC ROUTES ---");
  for (const route of publicRoutes) {
    const ms = await measureRoute(route);
    console.log(`${route.padEnd(35)} : ${ms} ms`);
  }

  // Admin authenticated endpoints
  console.log("\n--- ADMIN ENDPOINTS (Unauthenticated 401/303 check) ---");
  const adminRoutes = [
    "/admin/dashboard",
    "/admin/students",
    "/admin/certificates/requests",
    "/admin/certificates",
    "/api/admin/students",
    "/api/admin/certificates",
  ];
  for (const route of adminRoutes) {
    const ms = await measureRoute(route);
    console.log(`${route.padEnd(35)} : ${ms} ms`);
  }
}

benchmark();
