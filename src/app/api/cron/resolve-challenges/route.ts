import { db } from "@/lib/db";
import { challenges, users } from "@/lib/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { fetchLeetCodeContestRankResult } from "@/lib/leetcode";
import { fetchCodeforcesContestRankResult } from "@/lib/codeforces";
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
          },
        }),
        db.query.users.findFirst({
          where: eq(users.id, challenge.opponent_id),
          columns: {
            leetcode_username: true,
            codeforces_handle: true,
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
      let rankDataUnavailable = false;

      if (challenge.platform === "leetcode") {
        if (!challenger.leetcode_username || !opponent.leetcode_username) {
          console.warn(
            `[resolve-challenges] LC usernames missing for challenge ${challenge.id} — skipping`,
          );
          continue;
        }
        const [challengerResult, opponentResult] = await Promise.all([
          fetchLeetCodeContestRankResult(challenger.leetcode_username, challenge.contest_id),
          fetchLeetCodeContestRankResult(opponent.leetcode_username, challenge.contest_id),
        ]);
        challengerRank = challengerResult.rank;
        opponentRank = opponentResult.rank;
        rankDataUnavailable = challengerResult.unavailable || opponentResult.unavailable;
      } else {
        // codeforces
        if (!challenger.codeforces_handle || !opponent.codeforces_handle) {
          console.warn(
            `[resolve-challenges] CF handles missing for challenge ${challenge.id} — skipping`,
          );
          continue;
        }
        const [challengerResult, opponentResult] = await Promise.all([
          fetchCodeforcesContestRankResult(challenger.codeforces_handle, challenge.contest_id),
          fetchCodeforcesContestRankResult(opponent.codeforces_handle, challenge.contest_id),
        ]);
        challengerRank = challengerResult.rank;
        opponentRank = opponentResult.rank;
        rankDataUnavailable = challengerResult.unavailable || opponentResult.unavailable;
      }

      if (rankDataUnavailable) {
        console.warn(
          `[resolve-challenges] Rank data unavailable for challenge ${challenge.id} — retrying later`,
        );
        continue;
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
        const winnerName = winnerId === challenge.challenger_id ? "challenger" : "opponent";
        const loserName = winnerName === "challenger" ? "opponent" : "challenger";

        console.log(
          `[resolve-challenges] ${challenge.id}: winner=${winnerName}, loser=${loserName}`,
        );
      } else {
        console.log(`[resolve-challenges] ${challenge.id}: draw`);
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
