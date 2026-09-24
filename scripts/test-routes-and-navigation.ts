import https from "https";
import http from "http";

const BASE_URL = "https://skillcertificate360.vercel.app";

const routesToTest = [
  // Public
  { path: "/", type: "Public Landing Page" },
  { path: "/skills", type: "Public Skills Catalogue" },
  { path: "/verify", type: "Public Certificate Verification" },
  { path: "/verify/invalid-id-test", type: "Certificate Verification Invalid ID" },
  { path: "/student/login", type: "Student Login Page" },
  { path: "/admin/login", type: "Admin Login Page" },

  // Student Unauthenticated Redirect Check
  { path: "/student/dashboard", type: "Student Dashboard (Protected)" },
  { path: "/student/skills", type: "Student Skills (Protected)" },
  { path: "/student/certificates", type: "Student Certificates (Protected)" },
  { path: "/student/profile", type: "Student Profile (Protected)" },

  // Admin Unauthenticated Redirect Check
  { path: "/admin/dashboard", type: "Admin Dashboard (Protected)" },
  { path: "/admin/courses", type: "Admin Courses (Protected)" },
  { path: "/admin/providers", type: "Admin Providers (Protected)" },
  { path: "/admin/skills", type: "Admin Skills (Protected)" },
  { path: "/admin/students", type: "Admin Students (Protected)" },
  { path: "/admin/certificates", type: "Admin Certificates (Protected)" },

  // Non-existent route
  { path: "/non-existent-page-404-test", type: "404 Route Test" },
];

function checkRoute(path: string): Promise<{ statusCode: number; redirectLocation?: string; error?: string }> {
  return new Promise((resolve) => {
    const req = https.request(
      `${BASE_URL}${path}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        timeout: 10000,
      },
      (res) => {
        resolve({
          statusCode: res.statusCode || 0,
          redirectLocation: res.headers.location,
        });
      }
    );

    req.on("error", (err) => resolve({ statusCode: 0, error: err.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ statusCode: 408, error: "Timeout" });
    });
    req.end();
  });
}

async function runRouteTests() {
  console.log("=== ROUTE & NAVIGATION AUDIT ===");
  for (const r of routesToTest) {
    const res = await checkRoute(r.path);
    console.log(`[HTTP ${res.statusCode}] ${r.type} -> ${r.path}`);
    if (res.redirectLocation) {
      console.log(`   └─ Redirects to: ${res.redirectLocation}`);
    }
    if (res.error) {
      console.log(`   └─ Error: ${res.error}`);
    }
  }
}

runRouteTests();
