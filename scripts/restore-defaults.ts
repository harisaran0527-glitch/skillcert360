import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const defaultSettings = [
  { key: "assessmentQuestionCount", value: 50 },
  { key: "assessmentDurationMinutes", value: 45 },
  { key: "assessmentViolationLimit", value: 3 },
  { key: "assessmentCooldownHours", value: 6 },
  { key: "certificateRequirement", value: true },
  { key: "autoSubmitOnViolation", value: true },
];

const passMarks = {
  Beginner: 30,
  Foundation: 30,
  Intermediate: 32,
  Advanced: 35,
  Professional: 35,
};

async function restoreDefaults() {
  console.log("Restoring admin settings defaults...");

  for (const { key, value } of defaultSettings) {
    await db.adminSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  for (const [levelName, passMark] of Object.entries(passMarks)) {
    const level = await db.skillLevel.findUnique({ where: { name: levelName } });
    if (level) {
      await db.skillLevel.update({
        where: { id: level.id },
        data: { passMark },
      });
    }
  }

  console.log("Admin defaults restored successfully:");
  console.log("- Questions: 50");
  console.log("- Duration: 45 minutes");
  console.log("- Violation Limit: 3");
  console.log("- Cooldown: 6 hours");
  console.log("- Certificate requirement: enabled");
  console.log("- Auto-submit on violation: enabled");
  console.log("- Pass marks: Beginner=30, Foundation=30, Intermediate=32, Advanced=35, Professional=35");
}

restoreDefaults()
  .catch((e) => {
    console.error("Error restoring defaults:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
