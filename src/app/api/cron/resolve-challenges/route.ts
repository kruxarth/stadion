import { db } from "@/lib/db";
import { challenges, users, stadionPointsLog } from "@/lib/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";
import { fetchLeetCodeContestRank } from "@/lib/leetcode";
import { fetchCodeforcesContestRank } from "@/lib/codeforces";
import { verifyCronAuth } from "@/lib/cronAuth";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find accepted challenges whose contest has ended
  const pending = await db
    .select({
      id: challenges.id,
      challenger_id: challenges.challenger_id,
      opponent_id: challenges.opponent_id,
      platform: challenges.platform,
      contest_id: challenges.contest_id,
      contest_name: challenges.contest_name,
      points_wagered: challenges.points_wagered,
    })
    .from(challenges)
    .where(
      and(
        eq(challenges.status, "accepted"),
        lt(challenges.contest_end, now),
      ),
    );

  console.log(`[resolve-challenges] Found ${pending.length} challenges to resolve`);

  let processed = 0;

  for (const challenge of pending) {
    try {
      // Fetch both users' handles/usernames
      const [challenger, opponent] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, challenge.challenger_id),
          columns: {
            leetcode_username: true,
            codeforces_handle: true,
            stadion_points: true,
          },
        }),
        db.query.users.findFirst({
          where: eq(users.id, challenge.opponent_id),
          columns: {
            leetcode_username: true,
            codeforces_handle: true,
            stadion_points: true,
          },
        }),
      ]);

      if (!challenger || !opponent) {
        console.warn(`[resolve-challenges] Missing user for challenge ${challenge.id}`);
        continue;
      }

      // Fetch ranks for both users
      let challengerRank: number | null = null;
      let opponentRank: number | null = null;

      if (challenge.platform === "leetcode") {
        if (!challenger.leetcode_username || !opponent.leetcode_username) {
          console.warn(
            `[resolve-challenges] LC usernames missing for challenge ${challenge.id} — skipping`,
          );
          continue;
        }
        [challengerRank, opponentRank] = await Promise.all([
          fetchLeetCodeContestRank(challenger.leetcode_username, challenge.contest_id),
          fetchLeetCodeContestRank(opponent.leetcode_username, challenge.contest_id),
        ]);
      } else {
        // codeforces
        if (!challenger.codeforces_handle || !opponent.codeforces_handle) {
          console.warn(
            `[resolve-challenges] CF handles missing for challenge ${challenge.id} — skipping`,
          );
          continue;
        }
        [challengerRank, opponentRank] = await Promise.all([
          fetchCodeforcesContestRank(challenger.codeforces_handle, challenge.contest_id),
          fetchCodeforcesContestRank(opponent.codeforces_handle, challenge.contest_id),
        ]);
      }

      // Determine outcome
      // null rank = did not participate = auto-loss (unless both null = draw)
      let winnerId: string | null = null;
      let isDraw = false;

      if (challengerRank === null && opponentRank === null) {
        isDraw = true; // Both didn't participate
      } else if (challengerRank === null) {
        winnerId = challenge.opponent_id; // Challenger no-show
      } else if (opponentRank === null) {
        winnerId = challenge.challenger_id; // Opponent no-show
      } else if (challengerRank === opponentRank) {
        isDraw = true; // Equal rank
      } else if (challengerRank < opponentRank) {
        winnerId = challenge.challenger_id; // Lower rank = better
      } else {
        winnerId = challenge.opponent_id;
      }

      const wager = challenge.points_wagered;

      // Update challenge
      await db
        .update(challenges)
        .set({
          status: "completed",
          challenger_rank: challengerRank,
          opponent_rank: opponentRank,
          winner_id: winnerId,
          updated_at: now,
        })
        .where(eq(challenges.id, challenge.id));

      if (!isDraw && winnerId) {
        const loserId =
          winnerId === challenge.challenger_id
            ? challenge.opponent_id
            : challenge.challenger_id;

        const winnerName = winnerId === challenge.challenger_id ? "challenger" : "opponent";
        const loserName = winnerName === "challenger" ? "opponent" : "challenger";

        // Log points changes for both users
        await db.insert(stadionPointsLog).values([
          {
            user_id: winnerId,
            source: "challenge",
            delta: wager,
            reason: `Won challenge vs ${loserName} in ${challenge.contest_name}`,
            related_challenge_id: challenge.id,
          },
          {
            user_id: loserId,
            source: "challenge",
            delta: -wager,
            reason: `Lost challenge vs ${winnerName} in ${challenge.contest_name}`,
            related_challenge_id: challenge.id,
          },
        ]);

        // Apply points immediately (recalculate-points cron will also pick this up)
        await db
          .update(users)
          .set({
            stadion_points: sql`${users.stadion_points} + ${wager}`,
            updated_at: now,
          })
          .where(eq(users.id, winnerId));

        await db
          .update(users)
          .set({
            stadion_points: sql`GREATEST(0, ${users.stadion_points} - ${wager})`,
            updated_at: now,
          })
          .where(eq(users.id, loserId));

        console.log(
          `[resolve-challenges] ${challenge.id}: winner=${winnerName}, wager=${wager}`,
        );
      } else {
        console.log(`[resolve-challenges] ${challenge.id}: draw — no points exchanged`);
      }

      processed++;
    } catch (err) {
      console.error(`[resolve-challenges] Error processing challenge ${challenge.id}:`, err);
      // Continue with next challenge — best-effort
    }
  }

  console.log(`[resolve-challenges] Done. Resolved ${processed}/${pending.length}`);
  return Response.json({ success: true, processed });
}
