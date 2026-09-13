export interface ProviderSeedData {
  slug: string;
  name: string;
  officialWebsite: string;
  logoUrl?: string;
  description: string;
}

export const PROVIDERS_SEED: ProviderSeedData[] = [
  {
    slug: 'cisco',
    name: 'Cisco',
    officialWebsite: 'https://www.netacad.com',
    logoUrl: 'https://www.netacad.com/sites/default/files/cisco_logo.png',
    description: 'Official Cisco Networking Academy and Skills for All learning resources.'
  },
  {
    slug: 'ibm',
    name: 'IBM',
    officialWebsite: 'https://skillsbuild.org',
    logoUrl: 'https://skillsbuild.org/logo.png',
    description: 'Official IBM SkillsBuild and IBM Training learning pathways.'
  },
  {
    slug: 'microsoft',
    name: 'Microsoft',
    officialWebsite: 'https://learn.microsoft.com',
    logoUrl: 'https://learn.microsoft.com/favicon.ico',
    description: 'Official Microsoft Learn learning paths and applied skills credentials.'
  },
  {
    slug: 'aws',
    name: 'Amazon Web Services (AWS)',
    officialWebsite: 'https://skillbuilder.aws',
    logoUrl: 'https://skillbuilder.aws/favicon.ico',
    description: 'Official AWS Skill Builder self-paced courses and training.'
  },
  {
    slug: 'google-cloud',
    name: 'Google Cloud',
    officialWebsite: 'https://www.cloudskillsboost.google',
    logoUrl: 'https://www.cloudskillsboost.google/favicon.ico',
    description: 'Official Google Cloud Skills Boost courses, badges, and learning paths.'
  },
  {
    slug: 'oracle',
    name: 'Oracle',
    officialWebsite: 'https://education.oracle.com',
    logoUrl: 'https://education.oracle.com/favicon.ico',
    description: 'Official Oracle University enterprise learning courses and certifications.'
  },
  {
    slug: 'nvidia',
    name: 'NVIDIA',
    officialWebsite: 'https://www.nvidia.com/en-us/training/',
    logoUrl: 'https://www.nvidia.com/favicon.ico',
    description: 'Official NVIDIA Deep Learning Institute (DLI) hands-on courses.'
  },
  {
    slug: 'github',
    name: 'GitHub',
    officialWebsite: 'https://skills.github.com',
    logoUrl: 'https://github.com/favicon.ico',
    description: 'Official GitHub Skills interactive learning repositories.'
  },
  {
    slug: 'red-hat',
    name: 'Red Hat',
    officialWebsite: 'https://www.redhat.com/en/services/training',
    logoUrl: 'https://www.redhat.com/favicon.ico',
    description: 'Official Red Hat enterprise open-source training and certifications.'
  },
  {
    slug: 'linux-foundation',
    name: 'Linux Foundation',
    officialWebsite: 'https://training.linuxfoundation.org',
    logoUrl: 'https://training.linuxfoundation.org/favicon.ico',
    description: 'Official Linux Foundation open-source technology courses and exams.'
  },
  {
    slug: 'mongodb',
    name: 'MongoDB',
    officialWebsite: 'https://learn.mongodb.com',
    logoUrl: 'https://learn.mongodb.com/favicon.ico',
    description: 'Official MongoDB University developer and administrator courses.'
  },
  {
    slug: 'salesforce',
    name: 'Salesforce',
    officialWebsite: 'https://trailhead.salesforce.com',
    logoUrl: 'https://trailhead.salesforce.com/favicon.ico',
    description: 'Official Salesforce Trailhead interactive modules and badges.'
  },
  {
    slug: 'uipath',
    name: 'UiPath',
    officialWebsite: 'https://academy.uipath.com',
    logoUrl: 'https://academy.uipath.com/favicon.ico',
    description: 'Official UiPath Academy Robotic Process Automation (RPA) training.'
  },
  {
    slug: 'sap',
    name: 'SAP',
    officialWebsite: 'https://learning.sap.com',
    logoUrl: 'https://learning.sap.com/favicon.ico',
    description: 'Official SAP Learning enterprise software development & analytics.'
  },
  {
    slug: 'servicenow',
    name: 'ServiceNow',
    officialWebsite: 'https://nowlearning.servicenow.com',
    logoUrl: 'https://nowlearning.servicenow.com/favicon.ico',
    description: 'Official ServiceNow Now Learning platform pathways.'
  },
  {
    slug: 'meta',
    name: 'Meta',
    officialWebsite: 'https://www.meta.com',
    logoUrl: 'https://www.meta.com/favicon.ico',
    description: 'Official Meta developer learning resources and frontend/backend courses.'
  },
  {
    slug: 'docker',
    name: 'Docker',
    officialWebsite: 'https://www.docker.com',
    logoUrl: 'https://www.docker.com/favicon.ico',
    description: 'Official Docker containerization training and learning content.'
  },
  {
    slug: 'cncf',
    name: 'Cloud Native Computing Foundation (CNCF)',
    officialWebsite: 'https://www.cncf.io/training/',
    logoUrl: 'https://www.cncf.io/favicon.ico',
    description: 'Official CNCF Kubernetes and cloud-native technology courses.'
  },
  {
    slug: 'hashicorp',
    name: 'HashiCorp',
    officialWebsite: 'https://developer.hashicorp.com',
    logoUrl: 'https://developer.hashicorp.com/favicon.ico',
    description: 'Official HashiCorp Terraform and infrastructure-as-code learning.'
  },
  {
    slug: 'postman',
    name: 'Postman',
    officialWebsite: 'https://academy.postman.com',
    logoUrl: 'https://academy.postman.com/favicon.ico',
    description: 'Official Postman Academy API development and testing certifications.'
  },
  {
    slug: 'databricks',
    name: 'Databricks',
    officialWebsite: 'https://www.databricks.com/learn',
    logoUrl: 'https://www.databricks.com/favicon.ico',
    description: 'Official Databricks Academy data engineering and AI training.'
  },
  {
    slug: 'snowflake',
    name: 'Snowflake',
    officialWebsite: 'https://learn.snowflake.com',
    logoUrl: 'https://learn.snowflake.com/favicon.ico',
    description: 'Official Snowflake University cloud data warehouse learning.'
  }
];
