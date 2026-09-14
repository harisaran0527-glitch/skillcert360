import { db } from "../src/lib/db";

async function resetAssessmentSettings() {
  console.log("=== RESETTING PRODUCTION ASSESSMENT CONFIGURATION TO 50 QUESTIONS ===");

  const settingsToReset = [
    { key: "assessmentQuestionCount", value: 50 },
    { key: "assessmentDurationMinutes", value: 45 },
    { key: "assessmentViolationLimit", value: 3 },
    { key: "assessmentCooldownHours", value: 6 },
    { key: "certificateRequirement", value: true },
    { key: "autoSubmitOnViolation", value: true },
    {
      key: "passMarksByLevel",
      value: {
        Beginner: 30,
        Foundation: 30,
        Intermediate: 32,
        Advanced: 35,
        Professional: 35,
        Pro: 35,
        Expert: 35,
      },
    },
  ];

  for (const s of settingsToReset) {
    await db.adminSetting.upsert({
      where: { key: s.key },
      create: { key: s.key, value: s.value },
      update: { value: s.value },
    });
    console.log(`✓ Updated ${s.key} = ${JSON.stringify(s.value)}`);
  }

  console.log("\nProduction Assessment Settings successfully reset to 50 questions & pass mark 30/50!");
  process.exit(0);
}

resetAssessmentSettings().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
