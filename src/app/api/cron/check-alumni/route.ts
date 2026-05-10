import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cronAuth";
import { deriveAcademicStatus, getAcademicStartYear } from "@/lib/academicYear";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const academicStartYear = getAcademicStartYear(now);

  const enrolledUsers = await db.query.users.findMany({
    where: isNotNull(users.graduation_year),
    columns: {
      id: true,
      username: true,
      graduation_year: true,
      program: true,
      college_year: true,
      is_alumni: true,
    },
  });

  let updated = 0;

  for (const user of enrolledUsers) {
    const status = deriveAcademicStatus({
      graduationYear: user.graduation_year,
      program: user.program,
      date: now,
    });

    if (
      user.college_year === status.collegeYear &&
      user.is_alumni === status.isAlumni
    ) {
      continue;
    }

    await db
      .update(users)
      .set({
        college_year: status.collegeYear,
        is_alumni: status.isAlumni,
        updated_at: now,
      })
      .where(eq(users.id, user.id));

    updated++;
  }

  console.log(
    `[check-alumni] Updated ${updated} academic statuses (academic_start_year=${academicStartYear})`,
  );

  return Response.json({ success: true, processed: updated });
}
