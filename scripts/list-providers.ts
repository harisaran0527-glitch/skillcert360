import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const providers = await db.provider.findMany();
  console.log("Providers in DB:", providers.map(p => ({ id: p.id, name: p.name, website: p.website })));
}

main().finally(() => db.$disconnect());
