/**
 * Codeforces API client.
 * Official API: https://codeforces.com/apimethod/
 * No authentication required for public endpoints.
 */

const CF_API = "https://codeforces.com/api";

async function cfGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${CF_API}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "OK") return null;
    return json.result as T;
  } catch {
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CodeforcesUserStats {
  rating: number | null;
  max_rating: number | null;
  rank: string | null;
  contests_participated: number;
}

interface CfUserInfo {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
}

interface CfRatingChange {
  contestId: number;
  rank: number;
}

// ─── Fetch user stats ─────────────────────────────────────────────────────────

export async function fetchCodeforcesStats(
  handle: string,
): Promise<CodeforcesUserStats | null> {
  try {
    const [userInfo, ratingHistory] = await Promise.all([
      cfGet<CfUserInfo[]>(`/user.info?handles=${encodeURIComponent(handle)}`),
      cfGet<CfRatingChange[]>(`/user.rating?handle=${encodeURIComponent(handle)}`),
    ]);

    // Handle doesn't exist
    if (!userInfo || userInfo.length === 0) return null;

    const user = userInfo[0];

    return {
      rating: user.rating ?? null,
      max_rating: user.maxRating ?? null,
      rank: user.rank ?? null,
      contests_participated: ratingHistory?.length ?? 0,
    };
  } catch (err) {
    console.error(`[codeforces] fetchCodeforcesStats failed for ${handle}:`, err);
    return null;
  }
}

// ─── Submission calendar (heatmap) ────────────────────────────────────────────

export interface ActivityDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface CfSubmission {
  creationTimeSeconds: number;
  verdict?: string;
}

/**
 * Returns 1 year of daily accepted submission counts for the ActivityCalendar component.
 */
export async function fetchCodeforcesSubmissionCalendar(
  handle: string,
): Promise<ActivityDay[]> {
  const submissions = await cfGet<CfSubmission[]>(
    `/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`,
  );

  const oneYearAgoSec = (Date.now() - 365 * 24 * 3600 * 1000) / 1000;
  const raw: Record<string, number> = {};

  if (submissions) {
    for (const s of submissions) {
      if (s.creationTimeSeconds < oneYearAgoSec) continue;
      if (s.verdict && s.verdict !== "OK") continue;
      const date = new Date(s.creationTimeSeconds * 1000).toISOString().slice(0, 10);
      raw[date] = (raw[date] ?? 0) + 1;
    }
  }

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

// ─── Upcoming contests ────────────────────────────────────────────────────────

export interface CodeforcesContest {
  id: number;
  name: string;
  startTimeSeconds: number;
  durationSeconds: number;
  phase: string;
}

export async function fetchUpcomingCodeforcesContests(): Promise<CodeforcesContest[]> {
  const result = await cfGet<CodeforcesContest[]>("/contest.list?gym=false");
  if (!result) return [];
  return result
    .filter((c) => c.phase === "BEFORE")
    .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
    .slice(0, 10);
}

// ─── Contest rank resolution ──────────────────────────────────────────────────

/**
 * Returns the user's rank (1-based) in a specific Codeforces contest,
 * or null if they did not participate or data is unavailable.
 *
 * @param contestId  Codeforces contest ID as a string, e.g. "1234"
 */
export async function fetchCodeforcesContestRank(
  handle: string,
  contestId: string,
): Promise<number | null> {
  const ratingHistory = await cfGet<CfRatingChange[]>(
    `/user.rating?handle=${encodeURIComponent(handle)}`,
  );

  if (!ratingHistory) return null;

  const entry = ratingHistory.find((c) => String(c.contestId) === contestId);
  return entry?.rank ?? null;
}
