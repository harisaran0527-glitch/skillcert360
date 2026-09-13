import { PrismaClient, UrlStatus, PricingType, CredentialType } from '@prisma/client';

const prisma = new PrismaClient();

async function validateCatalog() {
  console.log('\n=== SkillCert 360 — Catalogue Data Quality Audit ===\n');

  const skills = await prisma.skill.findMany({
    include: {
      category: true,
      level: true,
      courses: {
        include: {
          provider: true
        }
      }
    }
  });

  const providers = await prisma.provider.findMany({
    include: {
      courses: true
    }
  });

  const courses = await prisma.course.findMany({
    include: {
      skill: true,
      provider: true,
      level: true
    }
  });

  const qualityErrors: string[] = [];

  // --- 1. SKILLS BREAKDOWN ---
  const levelCounts: Record<string, number> = {
    Beginner: 0,
    Advanced: 0,
    Pro: 0,
    Expert: 0
  };

  const skillSlugs = new Set<string>();
  const duplicateSkillSlugs = new Set<string>();

  for (const s of skills) {
    if (skillSlugs.has(s.slug)) {
      duplicateSkillSlugs.add(s.slug);
      qualityErrors.push(`Duplicate Skill Slug: "${s.slug}"`);
    } else {
      skillSlugs.add(s.slug);
    }

    if (!s.categoryId) qualityErrors.push(`Skill "${s.name}" is missing a Category.`);
    if (!s.levelId) qualityErrors.push(`Skill "${s.name}" is missing a Level.`);

    if (s.level?.name) {
      levelCounts[s.level.name] = (levelCounts[s.level.name] || 0) + 1;
    }
  }

  console.log('--- SKILLS STATS ---');
  console.log(`Total Skills: ${skills.length}`);
  console.log(`  • Beginner: ${levelCounts.Beginner || 0}`);
  console.log(`  • Advanced: ${levelCounts.Advanced || 0}`);
  console.log(`  • Pro: ${levelCounts.Pro || 0}`);
  console.log(`  • Expert: ${levelCounts.Expert || 0}`);

  // --- 2. PROVIDER STATS ---
  console.log('\n--- PROVIDER STATS ---');
  console.log(`Total Providers: ${providers.length}`);
  for (const p of providers) {
    console.log(`  • ${p.name}: ${p.courses.length} course(s)`);
    if (!p.slug) {
      qualityErrors.push(`Provider "${p.name}" has missing slug.`);
    }
  }

  // --- 3. COURSES & MULTI-PROVIDER SKILLS STATS ---
  let multiProviderSkillsCount = 0;
  let maxProvidersForOneSkill = 0;
  let highestProviderSkillName = '';

  for (const s of skills) {
    const uniqueProviders = new Set(s.courses.map((c) => c.providerId));
    if (uniqueProviders.size > 1) {
      multiProviderSkillsCount++;
    }
    if (uniqueProviders.size > maxProvidersForOneSkill) {
      maxProvidersForOneSkill = uniqueProviders.size;
      highestProviderSkillName = s.name;
    }
  }

  const avgProvidersPerSkill = skills.length > 0 ? (courses.length / skills.length).toFixed(2) : '0';

  console.log('\n--- COURSES & MULTI-PROVIDER STATS ---');
  console.log(`Total Courses: ${courses.length}`);
  console.log(`Skills with Multiple Providers: ${multiProviderSkillsCount}`);
  console.log(`Highest Providers for one Skill: ${maxProvidersForOneSkill} (${highestProviderSkillName || 'N/A'})`);
  console.log(`Average Provider Choices per Skill: ${avgProvidersPerSkill}`);

  // Check for orphan courses
  for (const c of courses) {
    if (!c.skillId) qualityErrors.push(`Course ID "${c.id}" has no Skill attached.`);
    if (!c.providerId) qualityErrors.push(`Course ID "${c.id}" has no Provider attached.`);
    if (!c.officialUrl) qualityErrors.push(`Course ID "${c.id}" has missing officialUrl.`);
  }

  // --- 4. LINK VERIFICATION STATUSES ---
  const linkStatusCounts: Record<string, number> = {
    VERIFIED: 0,
    OFFICIAL_LINK_PENDING: 0,
    RETIRED: 0,
    UNAVAILABLE: 0
  };

  for (const c of courses) {
    const st = c.officialUrlStatus || 'OFFICIAL_LINK_PENDING';
    linkStatusCounts[st] = (linkStatusCounts[st] || 0) + 1;
  }

  console.log('\n--- OFFICIAL LINK STATUSES ---');
  console.log(`  • VERIFIED: ${linkStatusCounts.VERIFIED || 0}`);
  console.log(`  • OFFICIAL_LINK_PENDING: ${linkStatusCounts.OFFICIAL_LINK_PENDING || 0}`);
  console.log(`  • RETIRED: ${linkStatusCounts.RETIRED || 0}`);
  console.log(`  • UNAVAILABLE: ${linkStatusCounts.UNAVAILABLE || 0}`);

  // --- 5. CREDENTIAL OPPORTUNITIES ---
  const credentialCounts: Record<string, number> = {
    NONE: 0,
    COMPLETION_CERTIFICATE: 0,
    DIGITAL_BADGE: 0,
    ACHIEVEMENT: 0,
    APPLIED_SKILL: 0,
    MICROCREDENTIAL: 0,
    PROFESSIONAL_CERTIFICATION: 0
  };

  let totalCredentialOpportunities = 0;

  for (const c of courses) {
    if (c.credentialAvailable) {
      totalCredentialOpportunities++;
    }
    const ct = c.credentialType || 'NONE';
    credentialCounts[ct] = (credentialCounts[ct] || 0) + 1;
  }

  console.log('\n--- CREDENTIAL OPPORTUNITIES ---');
  console.log(`Total Credential Opportunities: ${totalCredentialOpportunities}`);
  console.log(`  • None: ${credentialCounts.NONE || 0}`);
  console.log(`  • Completion Certificate: ${credentialCounts.COMPLETION_CERTIFICATE || 0}`);
  console.log(`  • Digital Badge: ${credentialCounts.DIGITAL_BADGE || 0}`);
  console.log(`  • Achievement: ${credentialCounts.ACHIEVEMENT || 0}`);
  console.log(`  • Applied Skill: ${credentialCounts.APPLIED_SKILL || 0}`);
  console.log(`  • Microcredential: ${credentialCounts.MICROCREDENTIAL || 0}`);
  console.log(`  • Professional Certification: ${credentialCounts.PROFESSIONAL_CERTIFICATION || 0}`);

  // --- 6. PRICING DISTRIBUTION ---
  const pricingCounts: Record<string, number> = {
    FREE: 0,
    PAID: 0,
    FREE_LEARNING_PAID_EXAM: 0,
    SUBSCRIPTION: 0,
    UNKNOWN: 0
  };

  for (const c of courses) {
    const pt = c.pricingType || 'FREE';
    pricingCounts[pt] = (pricingCounts[pt] || 0) + 1;
  }

  console.log('\n--- PRICING DISTRIBUTION ---');
  console.log(`  • FREE: ${pricingCounts.FREE || 0}`);
  console.log(`  • FREE_LEARNING_PAID_EXAM: ${pricingCounts.FREE_LEARNING_PAID_EXAM || 0}`);
  console.log(`  • PAID: ${pricingCounts.PAID || 0}`);
  console.log(`  • SUBSCRIPTION: ${pricingCounts.SUBSCRIPTION || 0}`);
  console.log(`  • UNKNOWN: ${pricingCounts.UNKNOWN || 0}`);

  // --- 7. QUALITY PROBLEMS REPORT ---
  console.log('\n--- QUALITY PROBLEMS REPORT ---');
  console.log(`Structural quality errors: ${qualityErrors.length}`);
  if (qualityErrors.length === 0) {
    console.log('✓ Zero structural or data quality errors found!');
  } else {
    console.log(`❌ Found ${qualityErrors.length} quality problem(s):`);
    qualityErrors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
  }

  if (qualityErrors.length > 0) {
    process.exit(1);
  }
}

validateCatalog()
  .catch((err) => {
    console.error('Catalogue validation error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
