import { db } from "./db";

/**
 * Generates a structured certificate number for verified SkillCert 360 credentials.
 * Format: SC360-[YEAR]-[SKILL_TAG]-[SEQUENCE]
 * Example: SC360-2026-REACT-0042
 */
export function buildCertificateNumber(skillName: string, sequence: number, date: Date = new Date()): string {
	const year = date.getFullYear();
	const cleanTag = skillName
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 5)
		.padEnd(3, "X");
	const seqPadded = String(sequence).padStart(4, "0");

	return `SC360-${year}-${cleanTag}-${seqPadded}`;
}

type DbClient = typeof db;

/**
 * Ensures a certificate has a persistent certificateNumber assigned.
 * If one does not exist, it generates and persists it.
 */
export async function ensureCertificateNumber(certificateId: string, customDb: DbClient = db): Promise<string> {
	const cert = await customDb.certificate.findUnique({
		where: { id: certificateId },
		include: { skill: true },
	});

	if (!cert) {
		throw new Error("Certificate not found");
	}

	if (cert.certificateNumber) {
		return cert.certificateNumber;
	}

	const skillName = cert.skill?.name || "SKILL";

	// Find the total number of certificates that already have a certificateNumber assigned
	let seq = (await customDb.certificate.count({
		where: {
			certificateNumber: { not: null },
		},
	})) + 1;

	let assignedNumber = "";
	let attempts = 0;

	while (attempts < 5) {
		assignedNumber = buildCertificateNumber(skillName, seq, cert.issuedAt || new Date());
		try {
			await customDb.certificate.update({
				where: { id: certificateId },
				data: { certificateNumber: assignedNumber },
			});
			return assignedNumber;
		} catch (error: unknown) {
			// If duplicate key error (P2002 in Prisma), increment seq and retry
			const prismaErr = error as { code?: string };
			if (prismaErr?.code === "P2002") {
				seq += 1;
				attempts += 1;
			} else {
				throw error;
			}
		}
	}

	return assignedNumber;
}
