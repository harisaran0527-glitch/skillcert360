import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("saran@2007", 12);
  const updated = await db.user.updateMany({
    where: { email: "skillcertificate@gmail.com" },
    data: { passwordHash: hash, status: "ACTIVE", mustChangePassword: false },
  });
  console.log("Updated admin user password hash in Neon DB:", updated.count);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
