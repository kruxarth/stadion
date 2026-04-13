import { db } from "@/lib/db";
import { users, rankSnapshots } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cronAuth";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Today's date in UTC (YYYY-MM-DD)
  const todayUTC = new Date().toISOString().split("T")[0];

  const allUsers = await db
    .select({ id: users.id, stadion_points: users.stadion_points })
    .from(users)
    .orderBy(desc(users.stadion_points));

  console.log(`[snapshot-ranks] Snapshotting ${allUsers.length} users for ${todayUTC}`);

  let processed = 0;

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const rank = i + 1;

    await db
      .insert(rankSnapshots)
      .values({
        user_id: user.id,
        rank,
        stadion_points: user.stadion_points,
        snapshot_date: todayUTC,
      })
      .onConflictDoUpdate({
        target: [rankSnapshots.user_id, rankSnapshots.snapshot_date],
        set: {
          rank,
          stadion_points: user.stadion_points,
        },
      });

    processed++;
  }

  console.log(`[snapshot-ranks] Done. Snapshotted ${processed} users`);
  return Response.json({ success: true, processed });
}
