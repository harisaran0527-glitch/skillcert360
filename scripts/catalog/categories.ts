export interface CategorySeedData {
  slug: string;
  name: string;
}

export const CATEGORIES_SEED: CategorySeedData[] = [
  { slug: 'programming', name: 'Programming Languages' },
  { slug: 'web-development', name: 'Web Development' },
  { slug: 'data', name: 'Data & Analytics' },
  { slug: 'ai-machine-learning', name: 'Artificial Intelligence & ML' },
  { slug: 'cloud', name: 'Cloud Computing' },
  { slug: 'cybersecurity', name: 'Cybersecurity & Networking' },
  { slug: 'devops', name: 'DevOps & Infrastructure' },
  { slug: 'enterprise-automation', name: 'Enterprise & Automation' },
  { slug: 'systems-hardware', name: 'Systems & Hardware' },
  { slug: 'professional-skills', name: 'Career & Professional Skills' }
];
