/**
 * Admin password reset script — run once to sync the admin account in Neon
 * with the current SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env values.
 * Does NOT touch SkillLevel, departments, or any other data.
 */
import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@skillcert360.local").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  console.log(`Upserting admin: ${email}`);

  const existing = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (existing) {
    const updated = await db.user.update({
      where: { id: existing.id },
      data: { email, passwordHash, role: UserRole.ADMIN, status: "ACTIVE", mustChangePassword: false },
    });
    console.log(`✓ Updated existing admin record (id: ${updated.id})`);
  } else {
    const created = await db.user.create({
      data: { email, passwordHash, role: UserRole.ADMIN, status: "ACTIVE", mustChangePassword: false },
    });
    console.log(`✓ Created new admin record (id: ${created.id})`);
  }

  // Verify the hash works
  const verify = await db.user.findFirstOrThrow({ where: { email: { equals: email, mode: "insensitive" } } });
  const ok = await bcrypt.compare(password, verify.passwordHash);
  console.log(`✓ bcrypt.compare verification: ${ok ? "PASS" : "FAIL"}`);
  console.log(`✓ role=${verify.role} status=${verify.status} mustChangePassword=${verify.mustChangePassword}`);
}

main().finally(() => db.$disconnect());
