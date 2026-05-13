import { db } from "@/lib/db";
import { users, codeforcesStats } from "@/lib/db/schema";
import { isNotNull } from "drizzle-orm";
import { fetchCodeforcesStats } from "@/lib/codeforces";
import { verifyCronAuth } from "@/lib/cronAuth";
import { pMap } from "@/lib/concurrency";

const CONCURRENCY = 10;

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db
    .select({ id: users.id, codeforces_handle: users.codeforces_handle })
    .from(users)
    .where(isNotNull(users.codeforces_handle));

  console.log(`[sync-codeforces] Processing ${allUsers.length} users (concurrency=${CONCURRENCY})`);

  let processed = 0;

  await pMap(allUsers, async (user) => {
    const stats = await fetchCodeforcesStats(user.codeforces_handle!);
    if (!stats) {
      console.warn(`[sync-codeforces] No stats for ${user.codeforces_handle}`);
      return;
    }

    await db
      .insert(codeforcesStats)
      .values({
        user_id: user.id,
        rating: stats.rating,
        max_rating: stats.max_rating,
        rank: stats.rank,
        contests_participated: stats.contests_participated,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: codeforcesStats.user_id,
        set: {
          rating: stats.rating,
          max_rating: stats.max_rating,
          rank: stats.rank,
          contests_participated: stats.contests_participated,
          updated_at: new Date(),
        },
      });

    processed++;
  }, CONCURRENCY);

  console.log(`[sync-codeforces] Done. Processed ${processed}/${allUsers.length}`);
  return Response.json({ success: true, processed });
}
