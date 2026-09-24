import "dotenv/config";
import { PrismaClient, UrlStatus } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const verified = await db.course.findMany({
    where: { active: true, officialUrlStatus: "VERIFIED" },
    include: { skill: true },
  });

  for (const c of verified) {
    const u = (c.officialUrl || "").trim();
    const isGeneric =
      /^https?:\/\/[^\/]+\/?$/i.test(u) ||
      /\/browse\/?$/i.test(u) ||
      /\/courses\/?$/i.test(u) ||
      /\/search\?/i.test(u) ||
      /\/learn\/?$/i.test(u) ||
      /\/training\/?$/i.test(u);

    if (isGeneric) {
      console.log(`Fixing generic: ${c.skill.name} -> ${u}`);
      await db.course.update({
        where: { id: c.id },
        data: { officialUrl: "OFFICIAL_LINK_PENDING", officialUrlStatus: UrlStatus.UNAVAILABLE },
      });
    }
  }

  await db.$disconnect();
}

main().catch(err => console.error(err));
