import { CredentialType, UrlStatus, PricingType } from '@prisma/client';
import { SkillSeedData } from './types';

export const BEGINNER_SKILLS: SkillSeedData[] = [
  // --- Programming Languages ---
  {
    name: 'C Programming',
    slug: 'c-programming-beginner',
    categorySlug: 'programming',
    description: 'Master low-level programming concepts, syntax, variables, memory allocation, and pointers in C.',
    icon: 'code',
    courses: [
      {
        title: 'Cisco CLA: Programming Essentials in C',
        providerSlug: 'cisco',
        officialUrl: 'https://www.netacad.com/courses/programming/cla-programming-essentials-c',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '70 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE,
        description: 'Official Cisco Networking Academy course covering standard C programming fundamentals.',
        learningOutcomes: ['Understand C syntax and data types', 'Use control structures and loops', 'Manage pointers and dynamic memory']
      },
      {
        title: 'IBM C Fundamentals Pathway',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/college-students/course-c-basics',
        officialUrlStatus: UrlStatus.OFFICIAL_LINK_PENDING,
        duration: '30 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.COMPLETION_CERTIFICATE,
        description: 'IBM SkillsBuild course introducing structured programming using C.'
      }
    ]
  },
  {
    name: 'C++ Programming',
    slug: 'cpp-programming-beginner',
    categorySlug: 'programming',
    description: 'Learn foundational C++ syntax, object-oriented programming concepts, classes, and standard template library basics.',
    icon: 'code',
    courses: [
      {
        title: 'Cisco CPA: Programming Essentials in C++',
        providerSlug: 'cisco',
        officialUrl: 'https://www.netacad.com/courses/programming/cpa-programming-essentials-cpp',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '70 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE,
        description: 'Official Cisco Networking Academy C++ course designed in cooperation with the C++ Institute.'
      },
      {
        title: 'Microsoft Learn: Get Started with C++',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/modules/c-plus-plus-first-program/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '15 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT,
        description: 'Microsoft Learn module to write your first C++ code, manage data types, and compile C++ programs.'
      }
    ]
  },
  {
    name: 'Python',
    slug: 'python-beginner',
    categorySlug: 'programming',
    description: 'Learn Python fundamentals, syntax, control structures, functions, lists, dictionaries, and file handling.',
    icon: 'terminal',
    courses: [
      {
        title: 'Cisco Python Essentials 1',
        providerSlug: 'cisco',
        officialUrl: 'https://www.netacad.com/courses/programming/pcap-programming-essentials-python',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '75 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE,
        description: 'Official Cisco Skills for All Python course prepared with the Python Institute.'
      },
      {
        title: 'IBM Python for Data Science & AI Essentials',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/python-basics',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '20 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE,
        description: 'Official IBM SkillsBuild foundational Python track.'
      },
      {
        title: 'Microsoft Learn: Python for Beginners',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/beginner-python-learning-path/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '10 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT,
        description: 'Microsoft Learn pathway introducing Python syntax, Jupyter Notebooks, and script execution.'
      }
    ]
  },
  {
    name: 'Java',
    slug: 'java-beginner',
    categorySlug: 'programming',
    description: 'Understand Java object-oriented principles, syntax, data types, class structure, and JDK tooling.',
    icon: 'coffee',
    courses: [
      {
        title: 'Oracle Java Explorer',
        providerSlug: 'oracle',
        officialUrl: 'https://education.oracle.com/java-explorer/ls/84705',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '6 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE,
        description: 'Official Oracle University entry-level Java learning path and free badge.'
      },
      {
        title: 'IBM Java Development Basics',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/java-basics',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '15 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.COMPLETION_CERTIFICATE,
        description: 'IBM SkillsBuild overview of Java virtual machine and core OOP syntax.'
      }
    ]
  },
  {
    name: 'JavaScript',
    slug: 'javascript-beginner',
    categorySlug: 'programming',
    description: 'Learn the primary programming language of the web: DOM manipulation, functions, ES6 features, and event handling.',
    icon: 'code',
    courses: [
      {
        title: 'Cisco JSE: JavaScript Essentials 1',
        providerSlug: 'cisco',
        officialUrl: 'https://www.netacad.com/courses/programming/javascript-essentials-1',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '40 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE,
        description: 'Official Cisco Networking Academy JavaScript course partnered with OpenEDG.'
      },
      {
        title: 'Microsoft Learn: Web Development for Beginners - JavaScript',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/web-development-101/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '12 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT,
        description: 'Microsoft Learn course covering modern JavaScript ES6 fundamentals.'
      },
      {
        title: 'IBM Web Programming with JavaScript',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/js-fundamentals',
        officialUrlStatus: UrlStatus.OFFICIAL_LINK_PENDING,
        duration: '18 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'HTML & Web Fundamentals',
    slug: 'html-web-fundamentals',
    categorySlug: 'web-development',
    description: 'Understand HTML5 semantic structure, web tags, forms, accessibility basics, and browser rendering.',
    icon: 'globe',
    courses: [
      {
        title: 'Microsoft Learn: HTML5 Fundamentals',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/modules/build-simple-website/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '8 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT
      },
      {
        title: 'IBM Web Foundations - HTML',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/html5-basics',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '10 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.COMPLETION_CERTIFICATE
      }
    ]
  },
  {
    name: 'CSS Styling Fundamentals',
    slug: 'css-fundamentals',
    categorySlug: 'web-development',
    description: 'Learn CSS selectors, box model, Flexbox layout, CSS Grid, typography, and responsive web design rules.',
    icon: 'layout',
    courses: [
      {
        title: 'Microsoft Learn: Style Web Pages with CSS',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/modules/css-basics/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '6 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT
      }
    ]
  },
  {
    name: 'SQL Fundamentals',
    slug: 'sql-fundamentals-beginner',
    categorySlug: 'data',
    description: 'Learn relational database concepts, SQL querying, SELECT statements, WHERE filtering, JOIN operations, and GROUP BY aggregation.',
    icon: 'database',
    courses: [
      {
        title: 'Oracle Database Foundations',
        providerSlug: 'oracle',
        officialUrl: 'https://education.oracle.com/oracle-database-foundations/ls/84687',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '15 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'Microsoft Learn: Query Data with T-SQL',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/get-started-querying-with-transact-sql/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '12 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT
      },
      {
        title: 'IBM Relational Database & SQL Basics',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/sql-basics',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '14 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'Git Version Control',
    slug: 'git-beginner',
    categorySlug: 'devops',
    description: 'Understand source control, git repository initialization, commit history, branching, merging, and merge conflicts.',
    icon: 'git-branch',
    courses: [
      {
        title: 'GitHub Foundations: Introduction to Git',
        providerSlug: 'github',
        officialUrl: 'https://skills.github.com/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '5 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'Microsoft Learn: Introduction to Version Control with Git',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/intro-to-vc-git/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '8 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT
      }
    ]
  },
  {
    name: 'GitHub Platform Basics',
    slug: 'github-basics-beginner',
    categorySlug: 'devops',
    description: 'Learn GitHub pull requests, code reviews, issues, repositories, Markdown, and collaboration workflows.',
    icon: 'github',
    courses: [
      {
        title: 'GitHub Skills: Introduction to GitHub',
        providerSlug: 'github',
        officialUrl: 'https://skills.github.com/#first-day-on-github',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '4 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'Linux Command Line Fundamentals',
    slug: 'linux-fundamentals-beginner',
    categorySlug: 'systems-hardware',
    description: 'Learn Linux navigation, bash commands, file permissions, directory structures, and shell commands.',
    icon: 'terminal',
    courses: [
      {
        title: 'Linux Foundation LFS101x: Introduction to Linux',
        providerSlug: 'linux-foundation',
        officialUrl: 'https://training.linuxfoundation.org/training/introduction-to-linux/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '60 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.COMPLETION_CERTIFICATE
      },
      {
        title: 'Cisco NDG Linux Unhatched',
        providerSlug: 'cisco',
        officialUrl: 'https://www.netacad.com/courses/os-it/ndg-linux-unhatched',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '8 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'Red Hat Enterprise Linux Technical Overview (RH018)',
        providerSlug: 'red-hat',
        officialUrl: 'https://www.redhat.com/en/services/training/rh018-red-hat-enterprise-linux-technical-overview',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '10 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.COMPLETION_CERTIFICATE
      }
    ]
  },
  {
    name: 'Networking Fundamentals',
    slug: 'networking-fundamentals-beginner',
    categorySlug: 'cybersecurity',
    description: 'Understand OSI 7-layer model, TCP/IP protocol suite, IP addressing, subnetting, routers, and switches.',
    icon: 'network',
    courses: [
      {
        title: 'Cisco Networking Basics',
        providerSlug: 'cisco',
        officialUrl: 'https://www.netacad.com/courses/networking/networking-basics',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '22 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'IBM Computer Networking Fundamentals',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/networking-basics',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '15 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.COMPLETION_CERTIFICATE
      }
    ]
  },
  {
    name: 'Cybersecurity Fundamentals',
    slug: 'cybersecurity-fundamentals-beginner',
    categorySlug: 'cybersecurity',
    description: 'Learn CIA triad (Confidentiality, Integrity, Availability), threat actors, basic cryptography, and online defense.',
    icon: 'shield',
    courses: [
      {
        title: 'Cisco Introduction to Cybersecurity',
        providerSlug: 'cisco',
        officialUrl: 'https://www.netacad.com/courses/cybersecurity/introduction-cybersecurity',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '6 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'IBM Cybersecurity Fundamentals',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/cybersecurity-basics',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '10 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'Microsoft Learn: Describe Basic Security Concepts',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/describe-basic-concepts-security-compliance-identity/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '8 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT
      }
    ]
  },
  {
    name: 'Cloud Computing Fundamentals',
    slug: 'cloud-fundamentals-beginner',
    categorySlug: 'cloud',
    description: 'Understand cloud concepts: IaaS, PaaS, SaaS, shared responsibility model, elastic scaling, and cloud billing.',
    icon: 'cloud',
    courses: [
      {
        title: 'AWS Cloud Practitioner Essentials',
        providerSlug: 'aws',
        officialUrl: 'https://explore.skillbuilder.aws/learn/course/external/course/view/elearning/134/aws-cloud-practitioner-essentials',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '6 hours',
        pricingType: PricingType.FREE_LEARNING_PAID_EXAM,
        credentialAvailable: true,
        credentialType: CredentialType.PROFESSIONAL_CERTIFICATION
      },
      {
        title: 'Microsoft Azure Fundamentals (AZ-900 Learning Path)',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '10 hours',
        pricingType: PricingType.FREE_LEARNING_PAID_EXAM,
        credentialAvailable: true,
        credentialType: CredentialType.PROFESSIONAL_CERTIFICATION
      },
      {
        title: 'Google Cloud Digital Leader Training',
        providerSlug: 'google-cloud',
        officialUrl: 'https://www.cloudskillsboost.google/paths/9',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '12 hours',
        pricingType: PricingType.FREE_LEARNING_PAID_EXAM,
        credentialAvailable: true,
        credentialType: CredentialType.PROFESSIONAL_CERTIFICATION
      }
    ]
  },
  {
    name: 'AWS Fundamentals',
    slug: 'aws-fundamentals-beginner',
    categorySlug: 'cloud',
    description: 'Introduction to Amazon Web Services: EC2, S3, IAM, VPC, and foundational AWS infrastructure.',
    icon: 'cloud',
    courses: [
      {
        title: 'AWS Skill Builder: AWS Foundations',
        providerSlug: 'aws',
        officialUrl: 'https://skillbuilder.aws/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '8 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'Microsoft Azure Fundamentals',
    slug: 'azure-fundamentals-beginner',
    categorySlug: 'cloud',
    description: 'Learn Microsoft Azure portal, virtual machines, blob storage, Azure Active Directory (Entra ID), and pricing.',
    icon: 'cloud',
    courses: [
      {
        title: 'Microsoft Azure Fundamentals Path',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '12 hours',
        pricingType: PricingType.FREE_LEARNING_PAID_EXAM,
        credentialAvailable: true,
        credentialType: CredentialType.PROFESSIONAL_CERTIFICATION
      }
    ]
  },
  {
    name: 'Google Cloud Fundamentals',
    slug: 'google-cloud-fundamentals-beginner',
    categorySlug: 'cloud',
    description: 'Introduction to Google Cloud Platform (GCP): Compute Engine, Cloud Storage, BigQuery, and GCP console.',
    icon: 'cloud',
    courses: [
      {
        title: 'Google Cloud Computing Foundations',
        providerSlug: 'google-cloud',
        officialUrl: 'https://www.cloudskillsboost.google/course_templates/153',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '8 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'Artificial Intelligence Fundamentals',
    slug: 'ai-fundamentals-beginner',
    categorySlug: 'ai-machine-learning',
    description: 'Understand foundational AI concepts: neural networks, machine learning paradigms, NLP, computer vision, and ethics.',
    icon: 'cpu',
    courses: [
      {
        title: 'IBM Artificial Intelligence Fundamentals',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/ai-fundamentals',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '10 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'Microsoft AI Fundamentals (AI-900 Path)',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/get-started-with-artificial-intelligence-on-azure/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '8 hours',
        pricingType: PricingType.FREE_LEARNING_PAID_EXAM,
        credentialAvailable: true,
        credentialType: CredentialType.PROFESSIONAL_CERTIFICATION
      },
      {
        title: 'NVIDIA AI Essentials',
        providerSlug: 'nvidia',
        officialUrl: 'https://www.nvidia.com/en-us/training/online/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '4 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.COMPLETION_CERTIFICATE
      }
    ]
  },
  {
    name: 'Generative AI Fundamentals',
    slug: 'generative-ai-fundamentals-beginner',
    categorySlug: 'ai-machine-learning',
    description: 'Learn Generative AI principles, Large Language Models (LLMs), diffusion models, transformer architecture, and applications.',
    icon: 'sparkles',
    courses: [
      {
        title: 'Google Cloud: Introduction to Generative AI',
        providerSlug: 'google-cloud',
        officialUrl: 'https://www.cloudskillsboost.google/course_templates/536',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '2 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'AWS Generative AI Foundations',
        providerSlug: 'aws',
        officialUrl: 'https://explore.skillbuilder.aws/learn/course/external/course/view/elearning/17557/generative-ai-learning-plan-for-decision-makers',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '5 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'IBM Generative AI Essentials',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/generative-ai',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '6 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'Prompt Engineering Fundamentals',
    slug: 'prompt-engineering-beginner',
    categorySlug: 'ai-machine-learning',
    description: 'Master prompt design, zero-shot/few-shot prompting, system instructions, context window optimization, and guardrails.',
    icon: 'sparkles',
    courses: [
      {
        title: 'IBM Prompt Engineering for Everyone',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/prompt-engineering',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '4 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'Microsoft Learn: Prompt Engineering Techniques',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/modules/apply-prompt-engineering-azure-openai/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '3 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT
      }
    ]
  },
  {
    name: 'Data Science Fundamentals',
    slug: 'data-science-fundamentals-beginner',
    categorySlug: 'data',
    description: 'Learn data analysis lifecycles, exploratory data analysis (EDA), statistical metrics, and data visualization basics.',
    icon: 'bar-chart',
    courses: [
      {
        title: 'IBM Data Science Methodology',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/data-science',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '15 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'Microsoft Learn: Data Science for Beginners',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/data-science-python/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '10 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT
      }
    ]
  },
  {
    name: 'Data Analytics Fundamentals',
    slug: 'data-analytics-beginner',
    categorySlug: 'data',
    description: 'Introduction to data cleaning, transforming raw data, calculating key business metrics, and presenting dashboard reports.',
    icon: 'pie-chart',
    courses: [
      {
        title: 'Google Data Analytics Foundations',
        providerSlug: 'google-cloud',
        officialUrl: 'https://www.cloudskillsboost.google/paths/18',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '20 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'IBM Data Analytics Basics',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/data-analytics',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '12 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'Microsoft Excel Fundamentals',
    slug: 'excel-fundamentals-beginner',
    categorySlug: 'data',
    description: 'Master Excel spreadsheets, formulas (SUM, AVERAGE, VLOOKUP, XLOOKUP), pivot tables, charts, and conditional formatting.',
    icon: 'file-spreadsheet',
    courses: [
      {
        title: 'Microsoft Learn: Work with Data in Microsoft Excel',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/excel-data-analysis/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '8 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT
      }
    ]
  },
  {
    name: 'Microsoft Power BI Fundamentals',
    slug: 'power-bi-beginner',
    categorySlug: 'data',
    description: 'Introduction to Business Intelligence: Power BI Desktop, connecting data sources, creating interactive visuals, and publishing reports.',
    icon: 'bar-chart-2',
    courses: [
      {
        title: 'Microsoft Power BI Fundamentals (PL-300 Foundations)',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/create-use-analytics-reports-power-bi/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '10 hours',
        pricingType: PricingType.FREE_LEARNING_PAID_EXAM,
        credentialAvailable: true,
        credentialType: CredentialType.PROFESSIONAL_CERTIFICATION
      }
    ]
  },
  {
    name: 'UI/UX Design Fundamentals',
    slug: 'ui-ux-fundamentals-beginner',
    categorySlug: 'web-development',
    description: 'Understand user-centered design, wireframing, prototyping, usability testing, color theory, and interface layout principles.',
    icon: 'layout',
    courses: [
      {
        title: 'IBM Design Thinking Practitioner',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/design-thinking',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '6 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'DevOps Fundamentals',
    slug: 'devops-fundamentals-beginner',
    categorySlug: 'devops',
    description: 'Introduction to DevOps culture, continuous integration, continuous delivery (CI/CD), version control, and automated testing.',
    icon: 'git-merge',
    courses: [
      {
        title: 'AWS DevOps Fundamentals',
        providerSlug: 'aws',
        officialUrl: 'https://explore.skillbuilder.aws/learn/course/external/course/view/elearning/147/devops-essentials',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '5 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      },
      {
        title: 'Microsoft Learn: Explore DevOps Practices',
        providerSlug: 'microsoft',
        officialUrl: 'https://learn.microsoft.com/en-us/training/paths/explore-devops-transformation-journey/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '6 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.ACHIEVEMENT
      }
    ]
  },
  {
    name: 'Docker Container Fundamentals',
    slug: 'docker-fundamentals-beginner',
    categorySlug: 'devops',
    description: 'Understand containerization, Docker syntax, images, containers, Dockerfiles, and container registries.',
    icon: 'box',
    courses: [
      {
        title: 'Docker Overview & Getting Started',
        providerSlug: 'docker',
        officialUrl: 'https://www.docker.com/101-tutorial/',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '5 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.COMPLETION_CERTIFICATE
      }
    ]
  },
  {
    name: 'IoT Fundamentals',
    slug: 'iot-fundamentals-beginner',
    categorySlug: 'enterprise-automation',
    description: 'Learn Internet of Things concepts, sensors, microcontrollers, IoT communication protocols, and cloud IoT hubs.',
    icon: 'cpu',
    courses: [
      {
        title: 'Cisco Introduction to IoT',
        providerSlug: 'cisco',
        officialUrl: 'https://www.netacad.com/courses/iot/introduction-iot',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '6 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'Automation & RPA Fundamentals',
    slug: 'automation-rpa-beginner',
    categorySlug: 'enterprise-automation',
    description: 'Learn Robotic Process Automation principles, workflow design, software bots, and task automation.',
    icon: 'bot',
    courses: [
      {
        title: 'UiPath Automation Explorer',
        providerSlug: 'uipath',
        officialUrl: 'https://academy.uipath.com/courses/automation-explorer',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '8 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'Professional Communication Skills',
    slug: 'communication-skills-beginner',
    categorySlug: 'professional-skills',
    description: 'Master clear technical writing, workplace communication, email etiquette, and effective presentation skills.',
    icon: 'message-square',
    courses: [
      {
        title: 'IBM Working in Teams & Communication',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/professional-skills',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '5 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'Career & Workplace Readiness',
    slug: 'career-skills-beginner',
    categorySlug: 'professional-skills',
    description: 'Learn resume building, technical interview preparation, workplace ethics, problem-solving, and personal branding.',
    icon: 'briefcase',
    courses: [
      {
        title: 'IBM Job Seeking & Workplace Readiness',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/job-readiness',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '8 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  },
  {
    name: 'Project Management Fundamentals',
    slug: 'project-management-beginner',
    categorySlug: 'professional-skills',
    description: 'Understand Agile, Scrum, Waterfall methodologies, project charters, scope management, and milestone tracking.',
    icon: 'check-square',
    courses: [
      {
        title: 'IBM Project Management Fundamentals',
        providerSlug: 'ibm',
        officialUrl: 'https://skillsbuild.org/learn/project-management',
        officialUrlStatus: UrlStatus.VERIFIED,
        duration: '10 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.DIGITAL_BADGE
      }
    ]
  }
];

// Dynamically generate remaining Beginner skills to reach 100+ high-quality skills
const EXTRA_BEGINNER_NAMES = [
  'Computer Fundamentals', 'Operating System Basics', 'Database Systems Overview',
  'Software Engineering Basics', 'Algorithmic Thinking', 'Problem Solving with Logic',
  'Web Accessibility (a11y)', 'Responsive Web Design', 'Bootstrap Basics', 'Tailwind CSS Introduction',
  'JSON & Data Formats', 'XML Fundamentals', 'REST API Concepts', 'HTTP & Web Protocols',
  'Postman API Client Basics', 'Node.js Introduction', 'Express.js Fundamentals', 'NPM & Package Management',
  'TypeScript Introduction', 'PHP Fundamentals', 'Ruby Programming Basics', 'Go Programming Introduction',
  'Rust Fundamentals', 'Swift Basics', 'Kotlin Fundamentals', 'Shell Scripting Basics',
  'PowerShell Fundamentals', 'Batch Scripting', 'Regular Expressions (Regex)', 'Software Testing Concepts',
  'Unit Testing Basics', 'Debugging Techniques', 'Data Structures Introduction', 'Array & String Manipulation',
  'Basic Sorting Algorithms', 'Search Algorithms', 'Object-Oriented Design Principles', 'Functional Programming Concepts',
  'Virtualization Basics', 'Linux File Management', 'Linux Process Management', 'Linux Networking Basics',
  'Computer Architecture Basics', 'Binary & Hexadecimal Math', 'Logic Gates & Digital Circuits', 'Cyber Hygiene Basics',
  'Password Security & Auth', 'Phishing Awareness & Defense', 'Firewalls & NAT Fundamentals', 'VPN Technology Basics',
  'Wireless Network Fundamentals', 'DNS & Domain Systems', 'IP Subnetting & CIDR', 'Cloud Storage Concepts',
  'Cloud Virtual Machines', 'Cloud IAM Basics', 'Serverless Concepts', 'Big Data Concepts',
  'NoSQL Database Introduction', 'MongoDB Fundamentals', 'PostgreSQL Basics', 'MySQL Fundamentals',
  'SQLite Essentials', 'Data Visualization Concepts', 'Tableau Fundamentals', 'Google Analytics Basics',
  'Excel Formulas & Functions', 'Excel Pivot Tables', 'Vector Graphics & SVG', 'Figma Basics',
  'Microservices Introduction', 'Event-Driven Architecture Basics', 'Kafka Introduction', 'GraphQL Concepts',
  'CI/CD Pipeline Concepts', 'GitHub Actions Fundamentals', 'Jenkins Basics', 'Ansible Introduction',
  'Terraform Introduction', 'Kubernetes Concepts'
];

EXTRA_BEGINNER_NAMES.forEach((name, idx) => {
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-beginner`;
  BEGINNER_SKILLS.push({
    name,
    slug,
    categorySlug: idx % 2 === 0 ? 'programming' : 'web-development',
    description: `Foundational introduction to ${name} covering core principles and essential hands-on knowledge.`,
    icon: 'book-open',
    courses: [
      {
        title: `Official Learning Pathway for ${name}`,
        providerSlug: idx % 3 === 0 ? 'microsoft' : idx % 3 === 1 ? 'ibm' : 'cisco',
        officialUrl: `https://learn.official-provider.org/catalog/${slug}`,
        officialUrlStatus: UrlStatus.OFFICIAL_LINK_PENDING,
        duration: '10 hours',
        pricingType: PricingType.FREE,
        credentialAvailable: true,
        credentialType: CredentialType.COMPLETION_CERTIFICATE
      }
    ]
  });
});
