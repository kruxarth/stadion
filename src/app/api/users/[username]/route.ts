import { db } from "@/lib/db";
import { users, githubStats, leetcodeStats, codeforcesStats, userBadges, badges, challenges } from "@/lib/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { getBuilderRank, getChallengeRecord } from "@/lib/queries/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const [gh, lc, cf, earnedBadges, recentChallenges, challengeRecord] = await Promise.all([
    db.query.githubStats.findFirst({ where: eq(githubStats.user_id, user.id) }),
    db.query.leetcodeStats.findFirst({ where: eq(leetcodeStats.user_id, user.id) }),
    db.query.codeforcesStats.findFirst({ where: eq(codeforcesStats.user_id, user.id) }),

    db
      .select({
        slug: badges.slug,
        name: badges.name,
        description: badges.description,
        icon_url: badges.icon_url,
        award_key: userBadges.award_key,
        awarded_at: userBadges.awarded_at,
      })
      .from(userBadges)
      .innerJoin(badges, eq(badges.id, userBadges.badge_id))
      .where(eq(userBadges.user_id, user.id))
      .orderBy(desc(userBadges.awarded_at)),

    db
      .select({
        id: challenges.id,
        platform: challenges.platform,
        contest_name: challenges.contest_name,
        challenger_id: challenges.challenger_id,
        opponent_id: challenges.opponent_id,
        winner_id: challenges.winner_id,
        updated_at: challenges.updated_at,
      })
      .from(challenges)
      .where(
        and(
          or(eq(challenges.challenger_id, user.id), eq(challenges.opponent_id, user.id)),
          eq(challenges.status, "completed"),
        ),
      )
      .orderBy(desc(challenges.updated_at))
      .limit(5),

    getChallengeRecord(user.id),
  ]);

  const currentRank = await getBuilderRank(user.id, gh?.monthly_commits ?? 0);

  // Fetch opponent names for challenge history
  const opponentIds = recentChallenges.map((c) =>
    c.challenger_id === user.id ? c.opponent_id : c.challenger_id,
  );
  const opponentMap = new Map<string, string>();
  if (opponentIds.length > 0) {
    const opponents = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(sql`${users.id} = ANY(${sql.raw(`ARRAY[${opponentIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})`);
    for (const o of opponents) opponentMap.set(o.id, o.username);
  }

  const challengeHistory = recentChallenges.map((c) => {
    const opponentId = c.challenger_id === user.id ? c.opponent_id : c.challenger_id;
    const result =
      c.winner_id === null ? "draw" : c.winner_id === user.id ? "win" : "loss";
    return {
      id: c.id,
      platform: c.platform,
      contest_name: c.contest_name,
      opponent_username: opponentMap.get(opponentId) ?? "unknown",
      result,
      resolved_at: c.updated_at,
    };
  });

  return Response.json({
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      github_username: user.github_username,
      leetcode_username: user.leetcode_username,
      codeforces_handle: user.codeforces_handle,
      department: user.department,
      college_year: user.college_year,
      graduation_year: user.graduation_year,
      is_alumni: user.is_alumni,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    rank: currentRank,
    github_stats: gh ?? null,
    leetcode_stats: lc ?? null,
    codeforces_stats: cf ?? null,
    badges: earnedBadges,
    challenge_record: challengeRecord,
    challenge_history: challengeHistory,
  });
}
