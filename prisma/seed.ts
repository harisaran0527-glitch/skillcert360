import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const departments = ["AI & DS", "CSE", "IT", "ECE", "EEE", "Mechanical", "Civil"];
const levels = [["Beginner", 1, 30], ["Foundation", 2, 30], ["Intermediate", 3, 32], ["Advanced", 4, 35], ["Professional", 5, 35]] as const;

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@skillcert360.local").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const existingAdmin = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (existingAdmin) {
    await db.user.update({
      where: { id: existingAdmin.id },
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
        status: "ACTIVE",
        mustChangePassword: false,
      },
    });
  } else {
    await db.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
        status: "ACTIVE",
        mustChangePassword: false,
      },
    });
  }

  for (const name of departments) {
    const department = await db.department.upsert({ where: { name }, update: {}, create: { name } });
    await db.section.upsert({ where: { name_departmentId: { name: "A", departmentId: department.id } }, update: {}, create: { name: "A", departmentId: department.id } });
  }

  for (const [name, order, passMark] of levels) {
    await db.skillLevel.upsert({ where: { name }, update: { order, passMark }, create: { name, order, passMark } });
  }
}

main().finally(() => db.$disconnect());