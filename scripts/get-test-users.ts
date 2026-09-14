import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  const student = await db.studentProfile.findFirst({
    include: { user: true }
  });

  console.log("Admin email:", admin?.email);
  console.log("Student email:", student?.user.email, "| Register No:", student?.registerNumber);

  // Pick 5 VERIFIED courses from different providers/categories
  const verifiedCourses = await db.course.findMany({
    where: { officialUrlStatus: "VERIFIED" },
    include: { skill: true, provider: true },
    take: 10
  });

  console.log("\nSample 5 VERIFIED courses:");
  verifiedCourses.slice(0, 5).forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.id}] Skill: "${c.skill.name}" | Provider: "${c.provider.name}" | URL: ${c.officialUrl}`);
  });

  // Pick 3 OFFICIAL_LINK_PENDING courses
  const pendingCourses = await db.course.findMany({
    where: { officialUrlStatus: "OFFICIAL_LINK_PENDING" },
    include: { skill: true, provider: true },
    take: 5
  });

  console.log("\nSample 3 PENDING courses:");
  pendingCourses.slice(0, 3).forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.id}] Skill: "${c.skill.name}" | Provider: "${c.provider.name}" | URL: ${c.officialUrl}`);
  });

  await db.$disconnect();
}

main().catch(e => console.error(e));
