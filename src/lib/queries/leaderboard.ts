import { db } from "@/lib/db";
import { users, githubStats, leetcodeStats, codeforcesStats, rankSnapshots, userBadges, badges } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export interface LeaderboardUser {
  rank: number;
  rankChange: number | null; // positive = moved up, negative = moved down, null = NEW
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
  college_year: number | null;
  is_alumni: boolean;
  stadion_points: number;
  weekly_commits: number;
  monthly_commits: number;
  leetcode_rating: number | null;
  codeforces_rating: number | null;
  badges: Array<{ slug: string; name: string; icon_url: string | null }>;
}

export async function getLeaderboard(
  tab: "weekly" | "monthly" | "all-time",
  yearFilter: "all" | "1" | "2" | "3" | "4" | "alumni",
  page: number,
  pageSize: number = 25,
): Promise<{ users: LeaderboardUser[]; total: number }> {
  // Build the score expression based on tab
  const scoreExpr =
    tab === "weekly"
      ? sql<number>`COALESCE(${githubStats.weekly_commits}, 0) * 3`
      : tab === "monthly"
        ? sql<number>`COALESCE(${githubStats.monthly_commits}, 0) * 1`
        : sql<number>`${users.stadion_points}`;

  // Year filter condition
  let yearCondition = sql`TRUE`;
  if (yearFilter === "alumni") {
    yearCondition = sql`${users.is_alumni} = TRUE`;
  } else if (yearFilter !== "all") {
    yearCondition = sql`${users.college_year} = ${Number(yearFilter)}`;
  }

  const offset = (page - 1) * pageSize;

  // Fetch paginated users with stats
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      full_name: users.full_name,
      avatar_url: users.avatar_url,
      department: users.department,
      college_year: users.college_year,
      is_alumni: users.is_alumni,
      stadion_points: users.stadion_points,
      weekly_commits: sql<number>`COALESCE(${githubStats.weekly_commits}, 0)`,
      monthly_commits: sql<number>`COALESCE(${githubStats.monthly_commits}, 0)`,
      leetcode_rating: leetcodeStats.rating,
      codeforces_rating: codeforcesStats.rating,
      score: scoreExpr.as("score"),
    })
    .from(users)
    .leftJoin(githubStats, eq(githubStats.user_id, users.id))
    .leftJoin(leetcodeStats, eq(leetcodeStats.user_id, users.id))
    .leftJoin(codeforcesStats, eq(codeforcesStats.user_id, users.id))
    .where(yearCondition)
    .orderBy(desc(scoreExpr))
    .limit(pageSize)
    .offset(offset);

  // Total count for pagination
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(yearCondition);
  const total = Number(countResult[0]?.count ?? 0);

  // Yesterday's rank snapshots for rank-change indicators (all-time only)
  const yesterdayUTC = new Date();
  yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
  const yesterday = yesterdayUTC.toISOString().split("T")[0];

  const userIds = rows.map((r) => r.id);
  const snapshotMap = new Map<string, number>();

  if (tab === "all-time" && userIds.length > 0) {
    const snaps = await db
      .select({ user_id: rankSnapshots.user_id, rank: rankSnapshots.rank })
      .from(rankSnapshots)
      .where(
        sql`${rankSnapshots.user_id} = ANY(${sql.raw(`ARRAY[${userIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)}) AND ${rankSnapshots.snapshot_date} = ${yesterday}`,
      );
    for (const s of snaps) snapshotMap.set(s.user_id, s.rank);
  }

  // Fetch badges for these users
  const badgeRows = await db
    .select({
      user_id: userBadges.user_id,
      slug: badges.slug,
      name: badges.name,
      icon_url: badges.icon_url,
    })
    .from(userBadges)
    .innerJoin(badges, eq(badges.id, userBadges.badge_id))
    .where(
      sql`${userBadges.user_id} = ANY(${sql.raw(`ARRAY[${userIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})`,
    );

  const badgeMap = new Map<string, Array<{ slug: string; name: string; icon_url: string | null }>>();
  for (const b of badgeRows) {
    if (!badgeMap.has(b.user_id)) badgeMap.set(b.user_id, []);
    const existing = badgeMap.get(b.user_id)!;
    if (!existing.find((e) => e.slug === b.slug)) {
      existing.push({ slug: b.slug, name: b.name, icon_url: b.icon_url });
    }
  }

  const result: LeaderboardUser[] = rows.map((row, i) => {
    const currentRank = offset + i + 1;
    const prevRank = snapshotMap.get(row.id) ?? null;
    const rankChange = prevRank !== null ? prevRank - currentRank : null;

    return {
      rank: currentRank,
      rankChange,
      id: row.id,
      username: row.username,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      department: row.department,
      college_year: row.college_year,
      is_alumni: row.is_alumni,
      stadion_points: row.stadion_points,
      weekly_commits: Number(row.weekly_commits),
      monthly_commits: Number(row.monthly_commits),
      leetcode_rating: row.leetcode_rating,
      codeforces_rating: row.codeforces_rating,
      badges: badgeMap.get(row.id) ?? [],
    };
  });

  return { users: result, total };
}

export async function getTopLeaderboard(limit: number = 5): Promise<LeaderboardUser[]> {
  const { users: topUsers } = await getLeaderboard("all-time", "all", 1, limit);
  return topUsers;
}

export async function getLandingStats() {
  const [memberCount, commitSum, topUser] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(users),
    db.select({ total: sql<number>`COALESCE(SUM(${githubStats.weekly_commits}), 0)` }).from(githubStats),
    db.select({ username: users.username, full_name: users.full_name, stadion_points: users.stadion_points })
      .from(users)
      .orderBy(desc(users.stadion_points))
      .limit(1),
  ]);

  return {
    totalMembers: Number(memberCount[0]?.count ?? 0),
    weeklyCommits: Number(commitSum[0]?.total ?? 0),
    topUser: topUser[0] ?? null,
  };
}
