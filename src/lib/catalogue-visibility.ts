import { db } from "./db";
import { unstable_cache } from "next/cache";

// Select one existing record for each course mapping; never delete historical rows.
export const getCanonicalCourseIds = unstable_cache(
  async () => {
    const rows = await db.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT ON (lower(trim("name")), "skillId", "providerId") "id"
      FROM "Course"
      ORDER BY lower(trim("name")), "skillId", "providerId", "active" DESC,
        ("officialUrlStatus" = 'VERIFIED') DESC, "createdAt", "id"
    `;
    return rows.map((row) => row.id);
  },
  ["canonical-course-ids"],
  { revalidate: 300, tags: ["catalog"] }
);
