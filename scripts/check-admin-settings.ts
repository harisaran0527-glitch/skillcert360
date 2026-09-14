import { db } from "../src/lib/db";

async function checkAdminSettings() {
  const settings = await db.adminSetting.findMany();
  console.log("=== ADMIN SETTINGS IN DATABASE ===");
  settings.forEach((s) => console.log(`Key: ${s.key} | Value: ${JSON.stringify(s.value)}`));
  process.exit(0);
}

checkAdminSettings().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
