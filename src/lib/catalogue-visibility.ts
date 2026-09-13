import { db } from "./db";

// Select one existing record for each course mapping; never delete historical rows.
export async function getCanonicalCourseIds() {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT ON (lower(trim("name")), "skillId", "providerId") "id"
    FROM "Course"
    ORDER BY lower(trim("name")), "skillId", "providerId", "active" DESC,
      ("officialUrlStatus" = 'VERIFIED') DESC, "createdAt", "id"
  `;
  return rows.map(row => row.id);
}
