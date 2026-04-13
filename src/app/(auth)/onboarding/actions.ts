"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUser } from "@/lib/ensureUser";

interface OnboardingData {
  department: string;
  college_year: number;
  graduation_year: number;
  leetcode_username: string;
  codeforces_handle: string;
}

export async function completeOnboarding(data: OnboardingData) {
  const user = await ensureUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Validate college_year range
  if (data.college_year < 1 || data.college_year > 4) {
    throw new Error("College year must be between 1 and 4");
  }

  await db
    .update(users)
    .set({
      department: data.department,
      college_year: data.college_year,
      graduation_year: data.graduation_year,
      leetcode_username: data.leetcode_username.trim() || null,
      codeforces_handle: data.codeforces_handle.trim() || null,
      updated_at: new Date(),
    })
    .where(eq(users.id, user.id));

  redirect("/dashboard");
}
