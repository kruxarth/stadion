import { db } from "@/lib/db";
import { users, githubStats, leetcodeStats, codeforcesStats, badges, userBadges, challenges } from "@/lib/db/schema";
import { eq, desc, sql, and, isNotNull } from "drizzle-orm";

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getBadgeId(slug: string): Promise<string | null> {
  const badge = await db.query.badges.findFirst({ where: eq(badges.slug, slug) });
  return badge?.id ?? null;
}

async function awardBadge(userId: string, slug: string, awardKey: string): Promise<boolean> {
  const badgeId = await getBadgeId(slug);
  if (!badgeId) return false;
  try {
    await db.insert(userBadges).values({ user_id: userId, badge_id: badgeId, award_key: awardKey })
      .onConflictDoNothing();
    return true;
  } catch {
    return false;
  }
}

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ─── Individual badge evaluators ─────────────────────────────────────────────

async function checkCommitKing(awardKey: string): Promise<number> {
  const rows = await db
    .select({ user_id: githubStats.user_id, monthly_commits: githubStats.monthly_commits })
    .from(githubStats)
    .orderBy(desc(githubStats.monthly_commits))
    .limit(1);
  if (!rows[0] || rows[0].monthly_commits === 0) return 0;
  await awardBadge(rows[0].user_id, "commit-king", awardKey);
  return 1;
}

async function checkLeaderboardLegend(awardKey: string): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(desc(users.stadion_points))
    .limit(1);
  if (!rows[0]) return 0;
  await awardBadge(rows[0].id, "leaderboard-legend", awardKey);
  return 1;
}

async function checkArenaKing(awardKey: string): Promise<number> {
  const [year, month] = awardKey.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  // Count wins per user in the current month (using updated_at as resolution proxy)
  const winCounts = await db
    .select({
      user_id: challenges.winner_id,
      wins: sql<number>`COUNT(*)`,
    })
    .from(challenges)
    .where(
      and(
        eq(challenges.status, "completed"),
        isNotNull(challenges.winner_id),
        sql`${challenges.updated_at} >= ${monthStart} AND ${challenges.updated_at} < ${monthEnd}`,
      ),
    )
    .groupBy(challenges.winner_id)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(1);

  const top = winCounts[0];
  if (!top?.user_id || Number(top.wins) < 3) return 0;
  await awardBadge(top.user_id, "arena-king", awardKey);
  return 1;
}

async function checkCFKing(awardKey: string): Promise<number> {
  const rows = await db
    .select({ user_id: codeforcesStats.user_id, rating: codeforcesStats.rating })
    .from(codeforcesStats)
    .where(isNotNull(codeforcesStats.rating))
    .orderBy(desc(codeforcesStats.rating));

  if (rows.length < 2) return 0; // need at least 2 competitors
  await awardBadge(rows[0].user_id, "cf-king", awardKey);
  return 1;
}

async function checkLCKing(awardKey: string): Promise<number> {
  const rows = await db
    .select({ user_id: leetcodeStats.user_id, rating: leetcodeStats.rating })
    .from(leetcodeStats)
    .where(isNotNull(leetcodeStats.rating))
    .orderBy(desc(leetcodeStats.rating));

  if (rows.length < 2) return 0;
  await awardBadge(rows[0].user_id, "lc-king", awardKey);
  return 1;
}

async function checkAlumniLegend(): Promise<number> {
  const alumniUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.is_alumni, true));

  let awarded = 0;
  for (const user of alumniUsers) {
    const ok = await awardBadge(user.id, "alumni-legend", "once");
    if (ok) awarded++;
  }
  return awarded;
}

// ─── Main evaluator ───────────────────────────────────────────────────────────

export async function evaluateAllBadges(): Promise<number> {
  const awardKey = currentYearMonth();
  let total = 0;

  const results = await Promise.allSettled([
    checkCommitKing(awardKey),
    checkLeaderboardLegend(awardKey),
    checkArenaKing(awardKey),
    checkCFKing(awardKey),
    checkLCKing(awardKey),
    checkAlumniLegend(),
  ]);

  for (const r of results) {
    if (r.status === "fulfilled") total += r.value;
    else console.error("[badges] Evaluator failed:", r.reason);
  }

  return total;
}
