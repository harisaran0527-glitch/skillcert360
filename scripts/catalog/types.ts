import { CredentialType, UrlStatus, PricingType } from '@prisma/client';

export interface CourseData {
  title: string;
  providerSlug: string;
  officialUrl: string;
  officialUrlStatus: UrlStatus;
  duration?: string;
  pricingType: PricingType;
  credentialAvailable: boolean;
  credentialType: CredentialType;
  credentialUrl?: string;
  description?: string;
  prerequisites?: string;
  learningOutcomes?: string[];
}

export interface SkillSeedData {
  name: string;
  slug: string;
  categorySlug: string;
  description: string;
  icon?: string;
  courses: CourseData[];
}
