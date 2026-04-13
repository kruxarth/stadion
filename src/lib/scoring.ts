/**
 * Stadion Points Scoring Formula
 *
 * stat_score = (weekly_commits  × WEEKLY_COMMITS)
 *            + (monthly_commits × MONTHLY_COMMITS)
 *            + (leetcode_rating × LEETCODE_RATING)   // effectively rating / 10
 *            + (codeforces_rating × CODEFORCES_RATING) // effectively rating / 10
 *            + (problems_solved  × PROBLEMS_SOLVED)
 *
 * Final stadion_points (written by recalculate-points cron):
 *   stadion_points = Math.max(0, Math.floor(stat_score))
 *                  + SUM(delta FROM stadion_points_log WHERE user_id = ?)
 *
 * Challenge wins/losses and manual admin corrections are tracked exclusively
 * in stadion_points_log and added on top. They are NOT part of this function.
 * Adjust weights here to rebalance the scoring system.
 */

export const WEIGHTS = {
  /** Points per commit in the last 7 days */
  WEEKLY_COMMITS: 3,
  /** Points per commit in the current UTC calendar month */
  MONTHLY_COMMITS: 1,
  /** Multiplier for LeetCode contest rating (= rating / 10) */
  LEETCODE_RATING: 0.1,
  /** Multiplier for Codeforces rating (= rating / 10) */
  CODEFORCES_RATING: 0.1,
  /** Points per problem solved on LeetCode */
  PROBLEMS_SOLVED: 0.5,
} as const;

interface GithubStatsInput {
  weekly_commits: number;
  monthly_commits: number;
}

interface LeetcodeStatsInput {
  rating: number | null;
  problems_solved: number;
}

interface CodeforcesStatsInput {
  rating: number | null;
}

/**
 * Calculates the stat-based component of a user's Stadion Points.
 * Pure function — no DB access, no side effects.
 *
 * Null stats (user has no GitHub / hasn't linked LC or CF) are treated as 0.
 * Result is always a non-negative integer.
 */
export function calculateStatScore(
  githubStats: GithubStatsInput | null,
  leetcodeStats: LeetcodeStatsInput | null,
  codeforcesStats: CodeforcesStatsInput | null,
): number {
  const weekly = githubStats?.weekly_commits ?? 0;
  const monthly = githubStats?.monthly_commits ?? 0;
  const lcRating = leetcodeStats?.rating ?? 0;
  const cfRating = codeforcesStats?.rating ?? 0;
  const problems = leetcodeStats?.problems_solved ?? 0;

  const raw =
    weekly * WEIGHTS.WEEKLY_COMMITS +
    monthly * WEIGHTS.MONTHLY_COMMITS +
    lcRating * WEIGHTS.LEETCODE_RATING +
    cfRating * WEIGHTS.CODEFORCES_RATING +
    problems * WEIGHTS.PROBLEMS_SOLVED;

  return Math.max(0, Math.floor(raw));
}
