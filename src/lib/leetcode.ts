/**
 * LeetCode API client.
 *
 * LeetCode has no official API. This uses their public GraphQL endpoint.
 * The schema is unofficial and may change without notice — all calls are
 * wrapped in try/catch and return null on failure.
 */

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T | null> {
  try {
    const res = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) return null;
    return json.data as T;
  } catch {
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeetCodeUserStats {
  rating: number | null;
  problems_solved: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  contests_participated: number;
}

// ─── Fetch user stats ─────────────────────────────────────────────────────────

export async function fetchLeetCodeStats(
  username: string,
): Promise<LeetCodeUserStats | null> {
  try {
    type ProblemData = {
      matchedUser: {
        submitStatsGlobal: {
          acSubmissionNum: Array<{ difficulty: string; count: number }>;
        };
      } | null;
    };
    type ContestData = {
      userContestRanking: {
        rating: number;
        attendedContestsCount: number;
      } | null;
    };

    const [problemData, contestData] = await Promise.all([
      gql<ProblemData>(
        `query GetProblemStats($username: String!) {
          matchedUser(username: $username) {
            submitStatsGlobal {
              acSubmissionNum { difficulty count }
            }
          }
        }`,
        { username },
      ),
      gql<ContestData>(
        `query GetContestRanking($username: String!) {
          userContestRanking(username: $username) {
            rating
            attendedContestsCount
          }
        }`,
        { username },
      ),
    ]);

    // User doesn't exist on LeetCode
    if (!problemData?.matchedUser) return null;

    const acStats = problemData.matchedUser.submitStatsGlobal.acSubmissionNum;
    const easy = acStats.find((s) => s.difficulty === "Easy")?.count ?? 0;
    const medium = acStats.find((s) => s.difficulty === "Medium")?.count ?? 0;
    const hard = acStats.find((s) => s.difficulty === "Hard")?.count ?? 0;
    const total =
      acStats.find((s) => s.difficulty === "All")?.count ?? easy + medium + hard;

    const contest = contestData?.userContestRanking;

    return {
      rating: contest ? Math.round(contest.rating) : null,
      problems_solved: total,
      easy_count: easy,
      medium_count: medium,
      hard_count: hard,
      contests_participated: contest?.attendedContestsCount ?? 0,
    };
  } catch (err) {
    console.error(`[leetcode] fetchLeetCodeStats failed for ${username}:`, err);
    return null;
  }
}

// ─── Submission calendar (heatmap) ────────────────────────────────────────────

export interface ActivityDay {
  date: string;  // "YYYY-MM-DD"
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/**
 * Returns 1 year of daily submission counts for the ActivityCalendar component.
 */
export async function fetchLeetCodeSubmissionCalendar(
  username: string,
): Promise<ActivityDay[]> {
  type Data = {
    matchedUser: {
      userCalendar: { submissionCalendar: string } | null;
    } | null;
  };

  const data = await gql<Data>(
    `query GetCalendar($username: String!) {
      matchedUser(username: $username) {
        userCalendar { submissionCalendar }
      }
    }`,
    { username },
  );

  const raw: Record<string, number> = {};
  try {
    const cal = data?.matchedUser?.userCalendar?.submissionCalendar;
    if (cal) {
      const parsed = JSON.parse(cal) as Record<string, number>;
      for (const [ts, count] of Object.entries(parsed)) {
        const date = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
        raw[date] = (raw[date] ?? 0) + count;
      }
    }
  } catch { /* ignore */ }

  return buildActivityDays(raw);
}

function buildActivityDays(raw: Record<string, number>): ActivityDay[] {
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(today.getFullYear() - 1);

  const maxCount = Math.max(...Object.values(raw), 1);
  const result: ActivityDay[] = [];
  const cur = new Date(start);

  while (cur <= today) {
    const date = cur.toISOString().slice(0, 10);
    const count = raw[date] ?? 0;
    const ratio = count / maxCount;
    const level = (count === 0 ? 0 : ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4) as ActivityDay["level"];
    result.push({ date, count, level });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

// ─── Contest rank resolution ──────────────────────────────────────────────────

/**
 * Returns the user's rank (1-based) in a specific contest, or null if they
 * did not participate or the data is unavailable.
 *
 * This is best-effort — if LeetCode's schema changes, returns null and the
 * resolve-challenges cron will retry on the next run.
 *
 * @param contestSlug  LeetCode contest slug, e.g. "weekly-contest-400"
 */
// ─── Upcoming contests ────────────────────────────────────────────────────────

export interface LeetCodeContest {
  title: string;
  titleSlug: string;
  startTime: number; // Unix timestamp (seconds)
  duration: number;  // seconds
}

export async function fetchUpcomingLeetCodeContests(): Promise<LeetCodeContest[]> {
  type Data = { allContests: Array<{ title: string; titleSlug: string; startTime: number; duration: number }> };
  const data = await gql<Data>(
    `query { allContests { title titleSlug startTime duration } }`,
  );
  if (!data?.allContests) return [];
  const now = Math.floor(Date.now() / 1000);
  return data.allContests
    .filter((c) => c.startTime > now)
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, 10);
}

export async function fetchLeetCodeContestRank(
  username: string,
  contestSlug: string,
): Promise<number | null> {
  type HistoryData = {
    userContestRankingHistory: Array<{
      attended: boolean;
      ranking: number;
      contest: { titleSlug: string };
    }> | null;
  };

  const data = await gql<HistoryData>(
    `query GetContestHistory($username: String!) {
      userContestRankingHistory(username: $username) {
        attended
        ranking
        contest { titleSlug }
      }
    }`,
    { username },
  );

  if (!data?.userContestRankingHistory) return null;

  const entry = data.userContestRankingHistory.find(
    (h) => h.attended && h.contest.titleSlug === contestSlug,
  );

  return entry?.ranking ?? null;
}
