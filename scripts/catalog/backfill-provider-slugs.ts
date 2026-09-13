import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillProviderSlugs() {
  const providers = await prisma.provider.findMany({ where: { slug: null } });
  console.log(`Found ${providers.length} providers missing slug. Backfilling...`);
  for (const p of providers) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await prisma.provider.update({ where: { id: p.id }, data: { slug } });
    console.log(`  Fixed: "${p.name}" -> "${slug}"`);
  }
  console.log('Done!');
  await prisma.$disconnect();
}

backfillProviderSlugs().catch(console.error);
