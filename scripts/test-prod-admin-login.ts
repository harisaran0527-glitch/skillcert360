import "dotenv/config";

async function testAdminLogin() {
  const email = process.env.ADMIN_RESET_EMAIL || "";
  const password = process.env.ADMIN_RESET_PASSWORD || "";

  if (!email || !password) {
    console.error("FAIL: Target credentials not in environment variables.");
    process.exit(1);
  }

  const prodUrl = "https://skillcert360.vercel.app/api/auth/admin/login";

  console.log("=== VERIFYING PRODUCTION ADMIN LOGIN ===");
  console.log("1. Testing WRONG password request...");

  const wrongFormData = new URLSearchParams();
  wrongFormData.append("identifier", email);
  wrongFormData.append("password", "DefinitelyWrongPassword123!");

  const wrongRes = await fetch(prodUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: wrongFormData,
    redirect: "manual",
  });

  const wrongLocation = wrongRes.headers.get("location") || "";
  console.log("Wrong password HTTP status:", wrongRes.status);
  console.log("Wrong password redirect location:", wrongLocation);
  const wrongDenied = wrongLocation.includes("error=Invalid+credentials") || wrongLocation.includes("error=Invalid%20credentials");
  console.log("Wrong password correctly denied:", wrongDenied);

  console.log("\n2. Testing CORRECT credentials request...");

  const correctFormData = new URLSearchParams();
  correctFormData.append("identifier", email);
  correctFormData.append("password", password);

  const correctRes = await fetch(prodUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: correctFormData,
    redirect: "manual",
  });

  const correctLocation = correctRes.headers.get("location") || "";
  const setCookies = correctRes.headers.getSetCookie ? correctRes.headers.getSetCookie() : [correctRes.headers.get("set-cookie") || ""];
  const setCookieHeaderStr = setCookies.join("; ");
  console.log("Correct credentials HTTP status:", correctRes.status);
  console.log("Correct credentials redirect location:", correctLocation);
  console.log("Set-Cookie headers:", setCookies.map(c => c.split(";")[0]));
  console.log("Session cookie set:", setCookieHeaderStr.includes("skillcert_session"));

  const loginSuccess = correctRes.status === 303 && correctLocation.includes("/admin/dashboard") && setCookieHeaderStr.includes("skillcert_session");

  if (loginSuccess) {
    console.log("\nPASS: Production Admin Login Verified Successfully!");
  } else {
    console.error("\nFAIL: Production Admin Login failed!");
    process.exit(1);
  }
}

testAdminLogin().catch((err) => {
  console.error("Error testing admin login:", err?.message || err);
  process.exit(1);
});
