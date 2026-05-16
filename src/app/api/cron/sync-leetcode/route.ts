import { db } from "@/lib/db";
import { users, leetcodeStats } from "@/lib/db/schema";
import { and, eq, isNotNull, isNull, lt, or } from "drizzle-orm";
import { fetchLeetCodeStats } from "@/lib/leetcode";
import { verifyCronAuth } from "@/lib/cronAuth";

const LEETCODE_SYNC_INTERVAL_DAYS = 7;

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staleBefore = new Date(Date.now() - LEETCODE_SYNC_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
  const allUsers = await db
    .select({ id: users.id, leetcode_username: users.leetcode_username })
    .from(users)
    .leftJoin(leetcodeStats, eq(leetcodeStats.user_id, users.id))
    .where(
      and(
        isNotNull(users.leetcode_username),
        or(
          isNull(leetcodeStats.updated_at),
          lt(leetcodeStats.updated_at, staleBefore),
        ),
      ),
    );

  console.log(
    `[sync-leetcode] Processing ${allUsers.length} users with missing/stale stats older than ${LEETCODE_SYNC_INTERVAL_DAYS} days`,
  );

  let processed = 0;

  for (const user of allUsers) {
    // leetcode_username is guaranteed non-null by the WHERE clause
    const stats = await fetchLeetCodeStats(user.leetcode_username!);
    if (!stats) {
      console.warn(`[sync-leetcode] No stats for ${user.leetcode_username}`);
      continue;
    }

    await db
      .insert(leetcodeStats)
      .values({
        user_id: user.id,
        rating: stats.rating,
        problems_solved: stats.problems_solved,
        easy_count: stats.easy_count,
        medium_count: stats.medium_count,
        hard_count: stats.hard_count,
        contests_participated: stats.contests_participated,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
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

    console.log(
      `[sync-leetcode] ${user.leetcode_username}: rating=${stats.rating}, solved=${stats.problems_solved}`,
    );
    processed++;
  }

  console.log(`[sync-leetcode] Done. Processed ${processed}/${allUsers.length}`);
  return Response.json({ success: true, processed });
}
