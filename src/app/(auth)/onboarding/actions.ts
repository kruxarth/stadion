"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUser } from "@/lib/ensureUser";
import { deriveAcademicStatus, PROGRAMS } from "@/lib/academicYear";

interface OnboardingData {
  department: string;
  program: string;
  graduation_year: number;
  leetcode_username: string;
  codeforces_handle: string;
}

export async function completeOnboarding(data: OnboardingData) {
  const user = await ensureUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  if (!PROGRAMS.some((p) => p.value === data.program)) {
    throw new Error("Select a valid program");
  }

  const { collegeYear, isAlumni } = deriveAcademicStatus({
    graduationYear: data.graduation_year,
    program: data.program,
  });

  if (collegeYear === null && !isAlumni) {
    throw new Error("Graduation year does not match the selected program");
  }

  await db
    .update(users)
    .set({
      department: data.department,
      program: data.program,
      college_year: collegeYear,
      graduation_year: data.graduation_year,
      is_alumni: isAlumni,
      leetcode_username: data.leetcode_username.trim() || null,
      codeforces_handle: data.codeforces_handle.trim() || null,
      updated_at: new Date(),
    })
    .where(eq(users.id, user.id));

  redirect("/dashboard");
}
