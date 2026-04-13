"use server";

import { db } from "@/lib/db";
import { users, githubStats, leetcodeStats, codeforcesStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUser } from "@/lib/ensureUser";
import { fetchGitHubStats } from "@/lib/github";
import { fetchLeetCodeStats } from "@/lib/leetcode";
import { fetchCodeforcesStats } from "@/lib/codeforces";

export interface SettingsData {
  leetcode_username: string;
  codeforces_handle: string;
  department: string;
  college_year: string;
  graduation_year: string;
}

export async function updateSettings(data: SettingsData): Promise<{ success: boolean; error?: string }> {
  const user = await ensureUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const college_year = data.college_year ? Number(data.college_year) : null;
  if (college_year !== null && (college_year < 1 || college_year > 4)) {
    return { success: false, error: "College year must be between 1 and 4" };
  }

  const lcUsernameChanged = data.leetcode_username.trim() !== (user.leetcode_username ?? "");
  const cfHandleChanged = data.codeforces_handle.trim() !== (user.codeforces_handle ?? "");

  await db.update(users).set({
    leetcode_username: data.leetcode_username.trim() || null,
    codeforces_handle: data.codeforces_handle.trim() || null,
    department: data.department.trim() || null,
    college_year,
    graduation_year: data.graduation_year ? Number(data.graduation_year) : null,
    updated_at: new Date(),
  }).where(eq(users.id, user.id));

  // Immediate sync when LC/CF username changed
  if (lcUsernameChanged && data.leetcode_username.trim()) {
    const stats = await fetchLeetCodeStats(data.leetcode_username.trim());
    if (stats) {
      await db.insert(leetcodeStats).values({ user_id: user.id, ...stats, updated_at: new Date() })
        .onConflictDoUpdate({ target: leetcodeStats.user_id, set: { ...stats, updated_at: new Date() } });
    }
  }

  if (cfHandleChanged && data.codeforces_handle.trim()) {
    const stats = await fetchCodeforcesStats(data.codeforces_handle.trim());
    if (stats) {
      await db.insert(codeforcesStats).values({ user_id: user.id, ...stats, updated_at: new Date() })
        .onConflictDoUpdate({ target: codeforcesStats.user_id, set: { ...stats, updated_at: new Date() } });
    }
  }

  return { success: true };
}

export async function syncMyData(): Promise<{ success: boolean; error?: string }> {
  const user = await ensureUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const results = await Promise.allSettled([
    // GitHub
    (async () => {
      const stats = await fetchGitHubStats(user.github_username);
      if (!stats) return;
      await db.insert(githubStats)
        .values({ user_id: user.id, ...stats, updated_at: new Date() })
        .onConflictDoUpdate({ target: githubStats.user_id, set: { ...stats, updated_at: new Date() } });
    })(),
    // LeetCode
    (async () => {
      if (!user.leetcode_username) return;
      const stats = await fetchLeetCodeStats(user.leetcode_username);
      if (!stats) return;
      await db.insert(leetcodeStats)
        .values({ user_id: user.id, ...stats, updated_at: new Date() })
        .onConflictDoUpdate({ target: leetcodeStats.user_id, set: { ...stats, updated_at: new Date() } });
    })(),
    // Codeforces
    (async () => {
      if (!user.codeforces_handle) return;
      const stats = await fetchCodeforcesStats(user.codeforces_handle);
      if (!stats) return;
      await db.insert(codeforcesStats)
        .values({ user_id: user.id, ...stats, updated_at: new Date() })
        .onConflictDoUpdate({ target: codeforcesStats.user_id, set: { ...stats, updated_at: new Date() } });
    })(),
  ]);

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length === results.length) return { success: false, error: "All syncs failed" };
  return { success: true };
}
