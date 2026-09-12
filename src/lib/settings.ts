import { db } from "@/lib/db";

export const DEFAULT_ASSESSMENT_SETTINGS = {
  assessmentQuestionCount: 50,
  assessmentDurationMinutes: 45,
  assessmentViolationLimit: 3,
  assessmentCooldownHours: 6,
  certificateRequirement: true,
  autoSubmitOnViolation: true,
  passMarksByLevel: {
    Beginner: 30,
    Foundation: 30,
    Intermediate: 32,
    Advanced: 35,
    Professional: 35,
  },
} as const;

export async function getAssessmentSettings() {
  const rows = await db.adminSetting.findMany({
    where: {
      key: {
        in: [
          "assessmentQuestionCount",
          "assessmentDurationMinutes",
          "assessmentViolationLimit",
          "assessmentCooldownHours",
          "certificateRequirement",
          "autoSubmitOnViolation",
          "passMarksByLevel",
        ],
      },
    },
  });

  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  const passMarksByLevel = (map.passMarksByLevel as Record<string, number> | undefined) ?? DEFAULT_ASSESSMENT_SETTINGS.passMarksByLevel;

  return {
    questionCount: Number(map.assessmentQuestionCount ?? DEFAULT_ASSESSMENT_SETTINGS.assessmentQuestionCount),
    durationMinutes: Number(map.assessmentDurationMinutes ?? DEFAULT_ASSESSMENT_SETTINGS.assessmentDurationMinutes),
    violationLimit: Number(map.assessmentViolationLimit ?? DEFAULT_ASSESSMENT_SETTINGS.assessmentViolationLimit),
    cooldownHours: Number(map.assessmentCooldownHours ?? DEFAULT_ASSESSMENT_SETTINGS.assessmentCooldownHours),
    certificateRequirement: Boolean(map.certificateRequirement ?? DEFAULT_ASSESSMENT_SETTINGS.certificateRequirement),
    autoSubmitOnViolation: Boolean(map.autoSubmitOnViolation ?? DEFAULT_ASSESSMENT_SETTINGS.autoSubmitOnViolation),
    passMarksByLevel: {
      ...passMarksByLevel,
      Beginner: Number(passMarksByLevel.Beginner ?? 30),
      Foundation: Number(passMarksByLevel.Foundation ?? 30),
      Intermediate: Number(passMarksByLevel.Intermediate ?? 32),
      Advanced: Number(passMarksByLevel.Advanced ?? 35),
      Professional: Number(passMarksByLevel.Professional ?? 35),
    } as Record<string, number>,
  };
}

export async function getPassMarkForLevel(levelName: string) {
  const settings = await getAssessmentSettings();
  return Number(settings.passMarksByLevel[levelName as keyof typeof settings.passMarksByLevel] ?? settings.passMarksByLevel.Beginner ?? 30);
}
