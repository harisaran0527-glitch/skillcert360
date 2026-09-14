import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// List of official top-tier providers to ensure in DB
const PROVIDER_NAMES = [
  "Microsoft",
  "Amazon Web Services (AWS)",
  "Google Cloud",
  "Cisco",
  "IBM",
  "Oracle",
  "NVIDIA",
  "Red Hat",
  "MongoDB",
  "Salesforce",
  "UiPath",
  "SAP",
  "ServiceNow",
  "Meta",
  "Docker",
  "Cloud Native Computing Foundation (CNCF)",
  "Linux Foundation",
  "Postman",
  "Databricks",
  "Snowflake",
  "GitHub",
  "HashiCorp",
  "Coursera",
  "edX",
  "Harvard Online",
  "W3Schools",
  "MDN Web Docs",
  "FreeCodeCamp",
  "PyTorch Org",
  "TensorFlow Org",
  "Scikit-Learn Docs",
  "PostgreSQL Docs",
  "Redis Inc",
  "Apache Software Foundation",
  "OWASP Foundation",
];

async function ensureProviders() {
  const providerMap: Record<string, string> = {};

  for (const name of PROVIDER_NAMES) {
    let provider = await db.provider.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (!provider) {
      provider = await db.provider.create({
        data: {
          name,
          website: `https://${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        },
      });
      console.log(`Created provider: ${name} (${provider.id})`);
    }

    providerMap[name] = provider.id;
  }

  console.log("Providers ensured successfully.");
  return providerMap;
}

ensureProviders()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
