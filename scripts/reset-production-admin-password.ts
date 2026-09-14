import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function resetAdminPassword() {
  const rawEmail = process.env.ADMIN_RESET_EMAIL;
  const rawPassword = process.env.ADMIN_RESET_PASSWORD;

  if (!rawEmail || !rawPassword) {
    console.error("FAIL: ADMIN_RESET_EMAIL and ADMIN_RESET_PASSWORD environment variables must both be set.");
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();

  const user = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user) {
    console.error(`FAIL: No user found with email matching target.`);
    process.exit(1);
  }

  if (user.role !== UserRole.ADMIN) {
    console.error(`FAIL: User found but role is '${user.role}' (must be ADMIN). Refusing to update student credentials.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(rawPassword, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      email,
      passwordHash,
      status: "ACTIVE",
      mustChangePassword: false,
    },
  });

  console.log("Admin credentials updated successfully");
}

resetAdminPassword()
  .catch((err) => {
    console.error("FAIL: Error updating admin credentials:", err?.message || err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
