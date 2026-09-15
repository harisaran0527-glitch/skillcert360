import { db } from "@/lib/db";

/**
 * Generate a unique certificate number in the format:
 * SC360-{SKILL_CODE}-{YEAR}-{NNNNNN}
 * e.g., SC360-CS-2026-000042
 */
export function buildCertificateNumber(skillNameOrSlug: string, seq: number, date: Date = new Date()): string {
	const year = date.getFullYear().toString();
	
	// Create a 2 to 4 letter uppercase prefix from skill name or slug
	const sanitized = skillNameOrSlug.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
	let prefix = "GEN";
	if (sanitized.length >= 2) {
		prefix = sanitized.slice(0, 4);
	}

	const sequenceStr = seq.toString().padStart(6, "0");
	return `SC360-${prefix}-${year}-${sequenceStr}`;
}

/**
 * Ensures a certificate has a persistent certificateNumber assigned.
 * If one does not exist, it generates and persists it.
 */
export async function ensureCertificateNumber(certificateId: string, customDb: any = db): Promise<string> {
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
		} catch (error: any) {
			// If duplicate key error (P2002 in Prisma), increment seq and retry
			if (error?.code === "P2002") {
				seq += 1;
				attempts += 1;
			} else {
				throw error;
			}
		}
	}

	return assignedNumber;
}
