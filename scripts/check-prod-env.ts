import "dotenv/config";

function checkEnv() {
  const dbUrl = process.env.DATABASE_URL || "";
  const directUrl = process.env.DIRECT_URL || "";
  const sessionSecret = process.env.SESSION_SECRET || "";
  const storageProvider = process.env.STORAGE_PROVIDER || "";

  console.log("=== PRODUCTION ENVIRONMENT AUDIT ===");
  console.log("DATABASE_URL set:", !!dbUrl);
  console.log("DATABASE_URL is Neon pooled:", dbUrl.includes("neon.tech") || dbUrl.includes("pooler"));
  console.log("DIRECT_URL set:", !!directUrl);
  console.log("DIRECT_URL is Neon direct:", directUrl.includes("neon.tech"));
  console.log("SESSION_SECRET set:", !!sessionSecret && sessionSecret.length >= 16);
  console.log("STORAGE_PROVIDER set:", storageProvider);
}

checkEnv();
