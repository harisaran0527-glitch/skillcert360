import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";

const db = new PrismaClient();

async function inspect() {
  const admins = await db.user.findMany({
    where: { role: UserRole.ADMIN },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      mustChangePassword: true,
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log(`Found ${admins.length} admin user(s):`);
  for (const admin of admins) {
    console.log({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      mustChangePassword: admin.mustChangePassword,
      hasBcryptHash: admin.passwordHash.startsWith("$2a$") || admin.passwordHash.startsWith("$2b$"),
      hashLength: admin.passwordHash.length,
      updatedAt: admin.updatedAt,
    });
  }

  const targetUser = await db.user.findFirst({
    where: { email: { equals: "skillcertificate@gmail.com", mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log("Target user 'skillcertificate@gmail.com' search result:", targetUser);
}

inspect()
  .catch((err) => console.error(err))
  .finally(() => db.$disconnect());
