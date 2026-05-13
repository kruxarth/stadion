"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, leetcodeStats, codeforcesStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUser } from "@/lib/ensureUser";
import { deriveAcademicStatus, PROGRAMS } from "@/lib/academicYear";
import { fetchGitHubStats } from "@/lib/github";
import { fetchLeetCodeStats } from "@/lib/leetcode";
import { fetchCodeforcesStats } from "@/lib/codeforces";
import { githubStats } from "@/lib/db/schema";

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

  // Fetch and store initial stats in parallel
  await Promise.allSettled([
    // GitHub stats
    (async () => {
      const stats = await fetchGitHubStats(user.github_username);
      if (!stats) return;
      await db.insert(githubStats).values({
        user_id: user.id,
        weekly_commits: stats.weekly_commits,
        monthly_commits: stats.monthly_commits,
        top_languages: stats.top_languages,
        contribution_data: stats.contribution_data,
        updated_at: new Date(),
      }).onConflictDoUpdate({
        target: githubStats.user_id,
        set: {
          weekly_commits: stats.weekly_commits,
          monthly_commits: stats.monthly_commits,
          top_languages: stats.top_languages,
          contribution_data: stats.contribution_data,
          updated_at: new Date(),
        },
      });
    })(),
    // LeetCode stats
    (async () => {
      if (!data.leetcode_username.trim()) return;
      const stats = await fetchLeetCodeStats(data.leetcode_username.trim());
      if (!stats) return;
      await db.insert(leetcodeStats).values({
        user_id: user.id,
        rating: stats.rating,
        problems_solved: stats.problems_solved,
        easy_count: stats.easy_count,
        medium_count: stats.medium_count,
        hard_count: stats.hard_count,
        contests_participated: stats.contests_participated,
        updated_at: new Date(),
      }).onConflictDoUpdate({
        target: leetcodeStats.user_id,
        set: {
          rating: stats.rating,
          problems_solved: stats.problems_solved,
          easy_count: stats.easy_count,
          medium_count: stats.medium_count,
          hard_count: stats.hard_count,
          contests_participated: stats.contests_participated,
          updated_at: new Date(),
        },
      });
    })(),
    // Codeforces stats
    (async () => {
      if (!data.codeforces_handle.trim()) return;
      const stats = await fetchCodeforcesStats(data.codeforces_handle.trim());
      if (!stats) return;
      await db.insert(codeforcesStats).values({
        user_id: user.id,
        rating: stats.rating,
        max_rating: stats.max_rating,
        rank: stats.rank,
        contests_participated: stats.contests_participated,
        updated_at: new Date(),
      }).onConflictDoUpdate({
        target: codeforcesStats.user_id,
        set: {
          rating: stats.rating,
          max_rating: stats.max_rating,
          rank: stats.rank,
          contests_participated: stats.contests_participated,
          updated_at: new Date(),
        },
      });
    })(),
  ]);

  redirect("/dashboard");
}
