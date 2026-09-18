import { db } from "@/lib/db";

export type StudentProgressState =
  | "NOT_STARTED"
  | "LEARNING"
  | "LEARNING_COMPLETED"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "NEEDS_RESUBMISSION";

function resolveCertificateState(
  statuses: string[]
): StudentProgressState | null {
  if (statuses.includes("VERIFIED")) {
    return "VERIFIED";
  }

  if (
    statuses.includes("PENDING_VERIFICATION") ||
    statuses.includes("SUBMITTED") ||
    statuses.includes("PENDING_SUBMISSION")
  ) {
    return "PENDING_VERIFICATION";
  }

  if (statuses.includes("NEEDS_RESUBMISSION")) {
    return "NEEDS_RESUBMISSION";
  }

  if (statuses.includes("REJECTED")) {
    return "REJECTED";
  }

  return null;
}

export async function getSkillProgressState(
  studentId: string,
  skillId: string
): Promise<StudentProgressState> {
  const [entry, certificates] = await Promise.all([
    db.studentSkill.findUnique({
      where: {
        studentId_skillId: {
          studentId,
          skillId,
        },
      },
    }),

    db.certificate.findMany({
      where: {
        studentId,
        skillId,
      },
      select: {
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const certificateState = resolveCertificateState(
    certificates.map((certificate) => certificate.status)
  );

  if (certificateState) {
    return certificateState;
  }

  if (entry?.completedAt) {
    return "LEARNING_COMPLETED";
  }

  if (entry) {
    return "LEARNING";
  }

  return "NOT_STARTED";
}

export async function getSkillProgressSummary(studentId: string) {
  const [skills, studentSkills, certificates] = await Promise.all([
    db.skill.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
      },
    }),

    db.studentSkill.findMany({
      where: {
        studentId,
      },
    }),

    db.certificate.findMany({
      where: {
        studentId,
      },
      select: {
        skillId: true,
        status: true,
      },
    }),
  ]);

  const skillMap = new Map(
    studentSkills.map((studentSkill) => [
      studentSkill.skillId,
      studentSkill,
    ])
  );

  const certificatesBySkill = new Map<
    string,
    typeof certificates
  >();

  for (const certificate of certificates) {
    const current =
      certificatesBySkill.get(certificate.skillId) ?? [];

    current.push(certificate);

    certificatesBySkill.set(
      certificate.skillId,
      current
    );
  }

  return skills.map((skill) => {
    const entry = skillMap.get(skill.id);

    const skillCertificates =
      certificatesBySkill.get(skill.id) ?? [];

    const certificateState = resolveCertificateState(
      skillCertificates.map(
        (certificate) => certificate.status
      )
    );

    let state: StudentProgressState = "NOT_STARTED";

    if (certificateState) {
      state = certificateState;
    } else if (entry?.completedAt) {
      state = "LEARNING_COMPLETED";
    } else if (entry) {
      state = "LEARNING";
    }

    const verifiedCertificateCount =
      skillCertificates.filter(
        (certificate) =>
          certificate.status === "VERIFIED"
      ).length;

    const pendingCertificateCount =
      skillCertificates.filter(
        (certificate) =>
          certificate.status === "PENDING_VERIFICATION" ||
          certificate.status === "SUBMITTED" ||
          certificate.status === "PENDING_SUBMISSION"
      ).length;

    return {
      skillId: skill.id,
      skillName: skill.name,
      state,

      started: state !== "NOT_STARTED",

      completed: state === "VERIFIED",

      verifiedCertificateCount,
      pendingCertificateCount,
    };
  });
}