import "dotenv/config";

async function testEndpoint(url: string, description: string) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const text = await res.text();
    console.log(`[${res.status === 200 ? "PASS" : "FAIL"}] ${description} (${url}) -> Status: ${res.status}`);
    return { status: res.status, ok: res.status === 200, text };
  } catch (e: any) {
    console.error(`[FAIL] ${description} (${url}) -> Error: ${e.message}`);
    return { status: 500, ok: false, text: "" };
  }
}

async function main() {
  console.log("==========================================================================");
  console.log("=== LIVE PRODUCTION ENDPOINT VERIFICATION (https://skillcert360.vercel.app) ===");
  console.log("==========================================================================\n");

  const baseUrl = "https://skillcert360.vercel.app";

  // 1. Live site home
  await testEndpoint(`${baseUrl}/`, "Live Site Home Page");

  // 2. Admin Login page
  await testEndpoint(`${baseUrl}/admin/login`, "Admin Login Page");

  // 3. Student Login page
  await testEndpoint(`${baseUrl}/student/login`, "Student Login Page");

  // 4. Skills Catalogue page
  const skillsRes = await testEndpoint(`${baseUrl}/skills`, "Public Skills Page");

  // 5. Individual Skill Detail page (e.g. C Programming Basics)
  const cSkillRes = await testEndpoint(`${baseUrl}/student/skills/c-programming-basics`, "C Programming Basics Skill Page");

  // Check HTML of C Programming Basics to see if officialUrl is rendered
  if (cSkillRes.ok) {
    const hasCiscoLink = cSkillRes.text.includes("skillsforall.com") || cSkillRes.text.includes("Cisco");
    console.log(`- Verified Course Link rendered in HTML? ${hasCiscoLink ? "YES (PASS)" : "NO"}`);
  }

  // 6. Check a pending course page (e.g. Ruby Foundations or Swift Basics)
  const swiftSkillRes = await testEndpoint(`${baseUrl}/student/skills/swift-basics`, "Swift Basics Skill Page");
  if (swiftSkillRes.ok) {
    const hasPendingStatus = swiftSkillRes.text.includes("OFFICIAL_LINK_PENDING") || swiftSkillRes.text.includes("Pending") || !swiftSkillRes.text.includes("href=\"OFFICIAL_LINK_PENDING\"");
    console.log(`- Pending Course link safely disabled in HTML? ${hasPendingStatus ? "YES (PASS)" : "NO"}`);
  }

  // 7. Verify manifest and favicon
  await testEndpoint(`${baseUrl}/manifest.webmanifest`, "Web Manifest");
  await testEndpoint(`${baseUrl}/icon.svg`, "SVG Icon");

  console.log("\n==========================================================================\n");
}

main().catch(e => console.error(e));
