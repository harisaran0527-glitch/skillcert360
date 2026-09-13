import { PrismaClient, Prisma, UrlStatus, PricingType } from '@prisma/client';
import { PROVIDERS_SEED } from './providers';
import { CATEGORIES_SEED } from './categories';
import { BEGINNER_SKILLS } from './beginner-skills';
import { ADVANCED_SKILLS } from './advanced-skills';
import { PRO_SKILLS } from './pro-skills';
import { EXPERT_SKILLS } from './expert-skills';
import { SkillSeedData } from './types';

const prisma = new PrismaClient();

async function processInBatches<T>(items: T[], batchSize: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(fn));
  }
}

async function seedCatalog() {
  console.log('=== SkillCert 360 - Catalogue Import & Seed ===');

  // 1. Seed Providers
  console.log('Seeding official providers...');
  const providerMap = new Map<string, string>(); // slug -> id
  await processInBatches(PROVIDERS_SEED, 5, async (p) => {
    const existing = await prisma.provider.findFirst({
      where: { OR: [{ name: p.name }, { slug: p.slug }] }
    });

    let providerId: string;
    if (existing) {
      const updated = await prisma.provider.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          slug: p.slug,
          officialWebsite: p.officialWebsite,
          website: p.officialWebsite,
          logo: p.logoUrl,
          description: p.description,
          active: true
        }
      });
      providerId = updated.id;
    } else {
      const created = await prisma.provider.create({
        data: {
          name: p.name,
          slug: p.slug,
          officialWebsite: p.officialWebsite,
          website: p.officialWebsite,
          logo: p.logoUrl,
          description: p.description,
          active: true
        }
      });
      providerId = created.id;
    }
    providerMap.set(p.slug, providerId);
  });
  console.log(`✓ Seeded ${providerMap.size} official providers.`);

  // 2. Seed Categories
  console.log('Seeding categories...');
  const categoryMap = new Map<string, string>(); // slug -> id
  await processInBatches(CATEGORIES_SEED, 5, async (c) => {
    const existingCat = await prisma.skillCategory.findFirst({
      where: { OR: [{ slug: c.slug }, { name: c.name }] }
    });

    let catId: string;
    if (existingCat) {
      const updated = await prisma.skillCategory.update({
        where: { id: existingCat.id },
        data: { name: c.name, slug: c.slug, active: true }
      });
      catId = updated.id;
    } else {
      const created = await prisma.skillCategory.create({
        data: { name: c.name, slug: c.slug, active: true }
      });
      catId = created.id;
    }
    categoryMap.set(c.slug, catId);
  });
  console.log(`✓ Seeded ${categoryMap.size} categories.`);

  // 3. Ensure Skill Levels exist
  console.log('Ensuring skill levels...');
  const levelDefs = [
    { name: 'Beginner', order: 1, passMark: 30 },
    { name: 'Advanced', order: 2, passMark: 30 },
    { name: 'Pro', order: 3, passMark: 30 },
    { name: 'Expert', order: 4, passMark: 30 }
  ];

  const levelMap = new Map<string, string>(); // name -> id
  for (const lvl of levelDefs) {
    const level = await prisma.skillLevel.upsert({
      where: { name: lvl.name },
      update: { order: lvl.order, passMark: lvl.passMark, active: true },
      create: { name: lvl.name, order: lvl.order, passMark: lvl.passMark, active: true }
    });
    levelMap.set(lvl.name, level.id);
  }
  console.log('✓ Skill levels verified.');

  const defaultCategoryId = categoryMap.get('programming') || Array.from(categoryMap.values())[0];

  // Helper to seed skills for a level with batched concurrency
  async function seedSkillList(skills: SkillSeedData[], levelName: string) {
    const levelId = levelMap.get(levelName);
    if (!levelId) throw new Error(`Level ${levelName} not found`);

    let skillCount = 0;
    let courseCount = 0;

    await processInBatches(skills, 15, async (sData) => {
      const categoryId = categoryMap.get(sData.categorySlug) || defaultCategoryId;

      const existingSkill = await prisma.skill.findFirst({
        where: { OR: [{ slug: sData.slug }, { name: sData.name }] }
      });

      let skillId: string;
      if (existingSkill) {
        const updated = await prisma.skill.update({
          where: { id: existingSkill.id },
          data: {
            name: sData.name,
            slug: sData.slug,
            description: sData.description,
            icon: sData.icon || 'book-open',
            categoryId,
            levelId,
            active: true
          }
        });
        skillId = updated.id;
      } else {
        const created = await prisma.skill.create({
          data: {
            name: sData.name,
            slug: sData.slug,
            description: sData.description,
            icon: sData.icon || 'book-open',
            categoryId,
            levelId,
            active: true
          }
        });
        skillId = created.id;
      }
      skillCount++;

      // Seed Courses for this skill
      for (const cData of sData.courses) {
        const providerId = providerMap.get(cData.providerSlug) || Array.from(providerMap.values())[0];

        const existingCourse = await prisma.course.findFirst({
          where: {
            skillId,
            providerId,
            name: cData.title
          }
        });

        if (existingCourse) {
          await prisma.course.update({
            where: { id: existingCourse.id },
            data: {
              title: cData.title,
              name: cData.title,
              officialUrl: cData.officialUrl,
              officialUrlStatus: cData.officialUrlStatus,
              duration: cData.duration,
              pricingType: cData.pricingType,
              isFree: cData.pricingType === PricingType.FREE,
              certificateAvailable: cData.credentialAvailable,
              credentialAvailable: cData.credentialAvailable,
              credentialType: cData.credentialType,
              credentialUrl: cData.credentialUrl,
              description: cData.description,
              prerequisites: cData.prerequisites,
              learningOutcomes: cData.learningOutcomes ?? Prisma.DbNull,
              active: true
            }
          });
        } else {
          await prisma.course.create({
            data: {
              skillId,
              providerId,
              levelId,
              name: cData.title,
              title: cData.title,
              officialUrl: cData.officialUrl,
              officialUrlStatus: cData.officialUrlStatus,
              duration: cData.duration,
              pricingType: cData.pricingType,
              isFree: cData.pricingType === PricingType.FREE,
              certificateAvailable: cData.credentialAvailable,
              credentialAvailable: cData.credentialAvailable,
              credentialType: cData.credentialType,
              credentialUrl: cData.credentialUrl,
              description: cData.description,
              prerequisites: cData.prerequisites,
              learningOutcomes: cData.learningOutcomes ?? Prisma.DbNull,
              active: true
            }
          });
        }
        courseCount++;
      }
    });

    console.log(`✓ Seeded ${skillCount} ${levelName} skills with ${courseCount} provider courses.`);
  }

  // 4. Seed all 4 levels
  await seedSkillList(BEGINNER_SKILLS, 'Beginner');
  await seedSkillList(ADVANCED_SKILLS, 'Advanced');
  await seedSkillList(PRO_SKILLS, 'Pro');
  await seedSkillList(EXPERT_SKILLS, 'Expert');

  console.log('=== Catalogue Seed Completed Successfully ===');
}

seedCatalog()
  .catch((err) => {
    console.error('Seed catalog error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
