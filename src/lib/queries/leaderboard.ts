import { db } from "@/lib/db";
import { users, githubStats, leetcodeStats, codeforcesStats, userBadges, badges, challenges } from "@/lib/db/schema";
import { currentAwardKey, summarizeBadgeAwards } from "@/lib/badgeDisplay";
import { and, desc, eq, or, sql } from "drizzle-orm";

export type LeaderboardCategory = "builders" | "leetcode" | "codeforces" | "arena";

export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
  college_year: number | null;
  is_alumni: boolean;
  score: number;
  scoreLabel: string;
  weekly_commits: number;
  monthly_commits: number;
  leetcode_rating: number | null;
  codeforces_rating: number | null;
  challenge_wins: number;
  challenge_losses: number;
  challenge_draws: number;
  badges: Array<{
    slug: string;
    name: string;
    description: string;
    icon_url: string | null;
    count: number;
    awardLabels: string[];
    isCurrent: boolean;
  }>;
}

function yearCondition(yearFilter: "all" | "1" | "2" | "3" | "4" | "alumni") {
  if (yearFilter === "alumni") return sql`${users.is_alumni} = TRUE`;
  if (yearFilter !== "all") return sql`${users.college_year} = ${Number(yearFilter)}`;
  return sql`TRUE`;
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

function scoreLabel(category: LeaderboardCategory): string {
  switch (category) {
    case "builders":
      return "monthly contributions";
    case "leetcode":
      return "LC rating";
    case "codeforces":
      return "CF rating";
    case "arena":
      return "wins this month";
  }
}

export async function getLeaderboard(
  category: LeaderboardCategory,
  yearFilter: "all" | "1" | "2" | "3" | "4" | "alumni",
  page: number,
  pageSize: number = 25,
): Promise<{ users: LeaderboardUser[]; total: number }> {
  const { start: monthStart, end: monthEnd } = currentMonthRange();
  const filter = yearCondition(yearFilter);
  const offset = (page - 1) * pageSize;

  const monthlyWins = sql<number>`COALESCE(COUNT(${challenges.id}) FILTER (
    WHERE ${challenges.status} = 'completed'
      AND ${challenges.winner_id} = ${users.id}
      AND ${challenges.updated_at} >= ${monthStart}
      AND ${challenges.updated_at} < ${monthEnd}
  ), 0)`;
  const totalWins = sql<number>`COALESCE(COUNT(${challenges.id}) FILTER (
    WHERE ${challenges.status} = 'completed'
      AND ${challenges.winner_id} = ${users.id}
  ), 0)`;
  const totalLosses = sql<number>`COALESCE(COUNT(${challenges.id}) FILTER (
    WHERE ${challenges.status} = 'completed'
      AND (${challenges.challenger_id} = ${users.id} OR ${challenges.opponent_id} = ${users.id})
      AND ${challenges.winner_id} IS NOT NULL
      AND ${challenges.winner_id} <> ${users.id}
  ), 0)`;
  const totalDraws = sql<number>`COALESCE(COUNT(${challenges.id}) FILTER (
    WHERE ${challenges.status} = 'completed'
      AND (${challenges.challenger_id} = ${users.id} OR ${challenges.opponent_id} = ${users.id})
      AND ${challenges.winner_id} IS NULL
  ), 0)`;

  const scoreExpr =
    category === "builders"
      ? sql<number>`COALESCE(${githubStats.monthly_commits}, 0)`
      : category === "leetcode"
        ? sql<number>`COALESCE(${leetcodeStats.rating}, 0)`
        : category === "codeforces"
          ? sql<number>`COALESCE(${codeforcesStats.rating}, 0)`
          : monthlyWins;

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      full_name: users.full_name,
      avatar_url: users.avatar_url,
      department: users.department,
      college_year: users.college_year,
      is_alumni: users.is_alumni,
      weekly_commits: sql<number>`COALESCE(${githubStats.weekly_commits}, 0)`,
      monthly_commits: sql<number>`COALESCE(${githubStats.monthly_commits}, 0)`,
      leetcode_rating: leetcodeStats.rating,
      codeforces_rating: codeforcesStats.rating,
      score: scoreExpr.as("score"),
      challenge_wins: totalWins.as("challenge_wins"),
      challenge_losses: totalLosses.as("challenge_losses"),
      challenge_draws: totalDraws.as("challenge_draws"),
    })
    .from(users)
    .leftJoin(githubStats, eq(githubStats.user_id, users.id))
    .leftJoin(leetcodeStats, eq(leetcodeStats.user_id, users.id))
    .leftJoin(codeforcesStats, eq(codeforcesStats.user_id, users.id))
    .leftJoin(
      challenges,
      or(eq(challenges.challenger_id, users.id), eq(challenges.opponent_id, users.id)),
    )
    .where(filter)
    .groupBy(
      users.id,
      githubStats.weekly_commits,
      githubStats.monthly_commits,
      leetcodeStats.rating,
      codeforcesStats.rating,
    )
    .orderBy(desc(scoreExpr), desc(githubStats.weekly_commits), desc(users.created_at))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(filter);
  const total = Number(countResult[0]?.count ?? 0);

  const userIds = rows.map((r) => r.id);
  const badgeMap = new Map<string, Array<{
    slug: string;
    name: string;
    description: string;
    icon_url: string | null;
    count: number;
    awardLabels: string[];
    isCurrent: boolean;
  }>>();

  if (userIds.length > 0) {
    const current = currentAwardKey();
    const badgeRows = await db
      .select({
        user_id: userBadges.user_id,
        slug: badges.slug,
        name: badges.name,
        description: badges.description,
        icon_url: badges.icon_url,
        award_key: userBadges.award_key,
        awarded_at: userBadges.awarded_at,
      })
      .from(userBadges)
      .innerJoin(badges, eq(badges.id, userBadges.badge_id))
      .where(
        and(
          sql`${userBadges.user_id} = ANY(${sql.raw(`ARRAY[${userIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})`,
          or(eq(userBadges.award_key, "once"), eq(userBadges.award_key, current)),
        ),
      );

    const awardsByUser = new Map<string, typeof badgeRows>();
    for (const row of badgeRows) {
      awardsByUser.set(row.user_id, [...(awardsByUser.get(row.user_id) ?? []), row]);
    }

    for (const [userId, awards] of awardsByUser.entries()) {
      badgeMap.set(userId, summarizeBadgeAwards(awards));
    }
  }

  return {
    total,
    users: rows.map((row, i) => ({
      rank: offset + i + 1,
      id: row.id,
      username: row.username,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      department: row.department,
      college_year: row.college_year,
      is_alumni: row.is_alumni,
      score: Number(row.score),
      scoreLabel: scoreLabel(category),
      weekly_commits: Number(row.weekly_commits),
      monthly_commits: Number(row.monthly_commits),
      leetcode_rating: row.leetcode_rating,
      codeforces_rating: row.codeforces_rating,
      challenge_wins: Number(row.challenge_wins),
      challenge_losses: Number(row.challenge_losses),
      challenge_draws: Number(row.challenge_draws),
      badges: badgeMap.get(row.id) ?? [],
    })),
  };
}

export async function getTopLeaderboard(limit: number = 5): Promise<LeaderboardUser[]> {
  const { users: topUsers } = await getLeaderboard("builders", "all", 1, limit);
  return topUsers;
}

export async function getLandingStats() {
  const [memberCount, commitSum, topBuilder] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(users),
    db.select({ total: sql<number>`COALESCE(SUM(${githubStats.weekly_commits}), 0)` }).from(githubStats),
    db
      .select({
        username: users.username,
        full_name: users.full_name,
        monthly_commits: sql<number>`COALESCE(${githubStats.monthly_commits}, 0)`,
      })
      .from(users)
      .leftJoin(githubStats, eq(githubStats.user_id, users.id))
      .orderBy(desc(sql<number>`COALESCE(${githubStats.monthly_commits}, 0)`))
      .limit(1),
  ]);

  return {
    totalMembers: Number(memberCount[0]?.count ?? 0),
    weeklyCommits: Number(commitSum[0]?.total ?? 0),
    topUser: topBuilder[0] ?? null,
  };
}

export async function getChallengeRecord(userId: string) {
  const [record] = await db
    .select({
      wins: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${challenges.winner_id} = ${userId}), 0)`,
      losses: sql<number>`COALESCE(COUNT(*) FILTER (
        WHERE ${challenges.winner_id} IS NOT NULL
          AND ${challenges.winner_id} <> ${userId}
      ), 0)`,
      draws: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${challenges.winner_id} IS NULL), 0)`,
    })
    .from(challenges)
    .where(
      and(
        eq(challenges.status, "completed"),
        or(eq(challenges.challenger_id, userId), eq(challenges.opponent_id, userId)),
      ),
    );

  return {
    wins: Number(record?.wins ?? 0),
    losses: Number(record?.losses ?? 0),
    draws: Number(record?.draws ?? 0),
  };
}

export async function getBuilderRank(userId: string, monthlyCommits: number): Promise<number> {
  const [rankResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .leftJoin(githubStats, eq(githubStats.user_id, users.id))
    .where(sql`COALESCE(${githubStats.monthly_commits}, 0) > ${monthlyCommits}`);

  return Number(rankResult?.count ?? 0) + 1;
}
