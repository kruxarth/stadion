import { and, eq, lt, or } from "drizzle-orm";
import { fetchCodeforcesContestRankResults } from "@/lib/codeforces";
import { db } from "@/lib/db";
import { challenges, users } from "@/lib/db/schema";
import { fetchLeetCodeContestRankResult } from "@/lib/leetcode";

type ResolveChallengeOptions = {
  userId?: string;
  limit?: number;
};

type PendingChallenge = {
  id: string;
  challenger_id: string;
  opponent_id: string;
  platform: string;
  contest_id: string;
  contest_name: string;
  contest_end: Date;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const PLATFORM_RESULT_GRACE_MS: Record<string, number> = {
  codeforces: 24 * HOUR_MS,
  leetcode: 72 * HOUR_MS,
};

const FINAL_RESULT_CUTOFF_MS = 7 * DAY_MS;

export async function resolveEndedChallenges(options: ResolveChallengeOptions = {}) {
  const now = new Date();
  const conditions = [
    eq(challenges.status, "accepted"),
    lt(challenges.contest_end, now),
  ];

  if (options.userId) {
    conditions.push(
      or(
        eq(challenges.challenger_id, options.userId),
        eq(challenges.opponent_id, options.userId),
      )!,
    );
  }

  const query = db
    .select({
      id: challenges.id,
      challenger_id: challenges.challenger_id,
      opponent_id: challenges.opponent_id,
      platform: challenges.platform,
      contest_id: challenges.contest_id,
      contest_name: challenges.contest_name,
      contest_end: challenges.contest_end,
    })
    .from(challenges)
    .where(and(...conditions));

  const pending = options.limit ? await query.limit(options.limit) : await query;

  console.log(`[resolve-challenges] Found ${pending.length} challenges to resolve`);

  let processed = 0;

  for (const challenge of pending) {
    const didResolve = await resolveChallenge(challenge, now);
    if (didResolve) processed++;
  }

  console.log(`[resolve-challenges] Done. Resolved ${processed}/${pending.length}`);

  return {
    processed,
    total: pending.length,
  };
}

async function resolveChallenge(challenge: PendingChallenge, now: Date) {
  try {
    const elapsedSinceEnd = now.getTime() - new Date(challenge.contest_end).getTime();
    const graceMs = PLATFORM_RESULT_GRACE_MS[challenge.platform] ?? 24 * HOUR_MS;
    const finalCutoffReached = elapsedSinceEnd >= FINAL_RESULT_CUTOFF_MS;

    if (elapsedSinceEnd < graceMs) {
      console.log(
        `[resolve-challenges] ${challenge.id}: waiting for ${challenge.platform} official results`,
      );
      return false;
    }

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
      return false;
    }

    let challengerRank: number | null = null;
    let opponentRank: number | null = null;
    let rankDataUnavailable = false;

    if (challenge.platform === "leetcode") {
      if (!challenger.leetcode_username || !opponent.leetcode_username) {
        console.warn(
          `[resolve-challenges] LC usernames missing for challenge ${challenge.id} - skipping`,
        );
        return false;
      }

      const [challengerResult, opponentResult] = await Promise.all([
        fetchLeetCodeContestRankResult(challenger.leetcode_username, challenge.contest_id),
        fetchLeetCodeContestRankResult(opponent.leetcode_username, challenge.contest_id),
      ]);

      challengerRank = challengerResult.rank;
      opponentRank = opponentResult.rank;
      rankDataUnavailable = challengerResult.unavailable || opponentResult.unavailable;
    } else {
      if (!challenger.codeforces_handle || !opponent.codeforces_handle) {
        console.warn(
          `[resolve-challenges] CF handles missing for challenge ${challenge.id} - skipping`,
        );
        return false;
      }

      const cfResults = await fetchCodeforcesContestRankResults(
        [challenger.codeforces_handle, opponent.codeforces_handle],
        challenge.contest_id,
      );
      const challengerResult = cfResults[challenger.codeforces_handle];
      const opponentResult = cfResults[opponent.codeforces_handle];

      challengerRank = challengerResult.rank;
      opponentRank = opponentResult.rank;
      rankDataUnavailable = challengerResult.unavailable || opponentResult.unavailable;
    }

    if (rankDataUnavailable) {
      console.warn(
        `[resolve-challenges] Rank data unavailable for challenge ${challenge.id} - retrying later`,
      );
      return false;
    }

    const rankMissing = challengerRank === null || opponentRank === null;
    if (rankMissing && !finalCutoffReached) {
      console.warn(
        `[resolve-challenges] ${challenge.id}: incomplete ranks for ${challenge.platform} - retrying until final cutoff`,
      );
      return false;
    }

    if (rankMissing) {
      console.warn(
        `[resolve-challenges] ${challenge.id}: final cutoff reached with incomplete ranks - resolving without winner`,
      );
    }

    const winnerId = getWinnerId({
      challengerId: challenge.challenger_id,
      opponentId: challenge.opponent_id,
      challengerRank,
      opponentRank,
    });

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

    if (winnerId) {
      const winnerName = winnerId === challenge.challenger_id ? "challenger" : "opponent";
      const loserName = winnerName === "challenger" ? "opponent" : "challenger";

      console.log(
        `[resolve-challenges] ${challenge.id}: winner=${winnerName}, loser=${loserName}`,
      );
    } else {
      console.log(`[resolve-challenges] ${challenge.id}: draw`);
    }

    return true;
  } catch (err) {
    console.error(`[resolve-challenges] Error processing challenge ${challenge.id}:`, err);
    return false;
  }
}

function getWinnerId({
  challengerId,
  opponentId,
  challengerRank,
  opponentRank,
}: {
  challengerId: string;
  opponentId: string;
  challengerRank: number | null;
  opponentRank: number | null;
}) {
  if (challengerRank === null || opponentRank === null) {
    return null;
  }

  if (challengerRank === opponentRank) {
    return null;
  }

  return challengerRank < opponentRank ? challengerId : opponentId;
}
