import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Star, GitBranch, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ContributionHeatmap } from "@/components/profile/ContributionHeatmap";
import { PlatformHeatmap } from "@/components/profile/PlatformHeatmap";
import { fetchTopRepos } from "@/lib/github";
import { db } from "@/lib/db";
import {
  users, githubStats, leetcodeStats, codeforcesStats,
  userBadges, badges as badgesTable, challenges, rankSnapshots,
} from "@/lib/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import type { ContributionDay } from "@/lib/github";

const BADGE_EMOJI: Record<string, string> = {
  "commit-king": "👑", "leaderboard-legend": "🏆", "arena-king": "⚔️",
  "cf-king": "🔵", "lc-king": "🟡", "alumni-legend": "🎓",
};

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `${username} — Stadion` };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const user = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (!user) notFound();

  const [gh, lc, cf, earnedBadges, recentChallenges, rankResult] = await Promise.all([
    db.query.githubStats.findFirst({ where: eq(githubStats.user_id, user.id) }),
    db.query.leetcodeStats.findFirst({ where: eq(leetcodeStats.user_id, user.id) }),
    db.query.codeforcesStats.findFirst({ where: eq(codeforcesStats.user_id, user.id) }),
    db.select({ slug: badgesTable.slug, name: badgesTable.name, description: badgesTable.description,
        icon_url: badgesTable.icon_url, award_key: userBadges.award_key, awarded_at: userBadges.awarded_at })
      .from(userBadges).innerJoin(badgesTable, eq(badgesTable.id, userBadges.badge_id))
      .where(eq(userBadges.user_id, user.id)).orderBy(desc(userBadges.awarded_at)),
    db.select({ id: challenges.id, platform: challenges.platform, contest_name: challenges.contest_name,
        challenger_id: challenges.challenger_id, opponent_id: challenges.opponent_id,
        winner_id: challenges.winner_id, points_wagered: challenges.points_wagered, updated_at: challenges.updated_at })
      .from(challenges)
      .where(and(or(eq(challenges.challenger_id, user.id), eq(challenges.opponent_id, user.id)),
        eq(challenges.status, "completed")))
      .orderBy(desc(challenges.updated_at)).limit(5),
    db.select({ count: sql<number>`COUNT(*)` }).from(users)
      .where(sql`${users.stadion_points} > ${user.stadion_points}`),
  ]);

  const currentRank = Number(rankResult[0]?.count ?? 0) + 1;
  const topRepos = await fetchTopRepos(user.github_username);

  // Fetch opponent usernames for challenge history
  const opponentIds = recentChallenges.map((c) =>
    c.challenger_id === user.id ? c.opponent_id : c.challenger_id);
  const opponentMap = new Map<string, string>();
  if (opponentIds.length > 0) {
    const opponents = await db.select({ id: users.id, username: users.username }).from(users)
      .where(sql`${users.id} = ANY(${sql.raw(`ARRAY[${opponentIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})`);
    for (const o of opponents) opponentMap.set(o.id, o.username);
  }

  const contributionData = (gh?.contribution_data ?? []) as ContributionDay[];
  const totalProblems = (lc?.easy_count ?? 0) + (lc?.medium_count ?? 0) + (lc?.hard_count ?? 0) || 1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-5">
        <Avatar className="h-16 w-16 border-2 border-[#63e4e0]">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="text-xl font-mono font-bold bg-[#1e3040]">{user.full_name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-mono font-black text-2xl uppercase tracking-tight text-white">
            {user.full_name}
          </h1>
          <p className="font-mono text-sm text-[#63e4e0]">@{user.username}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mt-1">
            {user.department ?? "---"} //{" "}
            {user.is_alumni ? "ALUMNI" : user.college_year ? `YEAR ${user.college_year}` : "---"}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "STADION PTS", value: user.stadion_points.toLocaleString() },
          { label: "RANK", value: `#${currentRank}` },
          { label: "COMMITS /WK", value: String(gh?.weekly_commits ?? "---") },
          { label: "LC RATING", value: String(lc?.rating ?? (user.leetcode_username ? "UNRATED" : "---")) },
        ].map((s) => (
          <div key={s.label} className="brutal-border bg-[#293a4e] p-4 text-center">
            <p className="font-mono font-black text-2xl text-white">{s.value}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges shelf */}
      {earnedBadges.length > 0 && (
        <Card className="border-2 border-[rgba(99,228,224,0.2)]">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">BADGES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {earnedBadges.map((b) => (
                <Tooltip key={`${b.slug}-${b.award_key}`}>
                  <TooltipTrigger>
                    <div className="flex items-center gap-2 brutal-border bg-[#1e3040] px-3 py-2 cursor-default">
                      <span className="text-xl">{b.icon_url ? <img src={b.icon_url} className="h-5 w-5" alt={b.name} /> : (BADGE_EMOJI[b.slug] ?? "🏅")}</span>
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">{b.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono font-bold text-xs uppercase">{b.name}</p>
                    <p className="font-mono text-[10px] text-white/50">{b.description}</p>
                    <p className="font-mono text-[10px] text-white/30 mt-1">
                      Awarded {new Date(b.awarded_at).toLocaleDateString()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GitHub heatmap */}
      {contributionData.length > 0 && (
        <Card className="border-2 border-[rgba(99,228,224,0.2)]">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">GITHUB CONTRIBUTIONS</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <ContributionHeatmap data={contributionData} />
          </CardContent>
        </Card>
      )}

      {/* LeetCode heatmap */}
      {user.leetcode_username && (
        <Card className="border-2 border-[rgba(99,228,224,0.2)]">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">LEETCODE ACTIVITY</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <PlatformHeatmap
              url={`/api/heatmap/leetcode/${user.leetcode_username}`}
              platform="leetcode"
              label="LeetCode"
            />
          </CardContent>
        </Card>
      )}

      {/* Codeforces heatmap */}
      {user.codeforces_handle && (
        <Card className="border-2 border-[rgba(99,228,224,0.2)]">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">CODEFORCES ACTIVITY</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <PlatformHeatmap
              url={`/api/heatmap/codeforces/${user.codeforces_handle}`}
              platform="codeforces"
              label="Codeforces"
            />
          </CardContent>
        </Card>
      )}

      {/* Bottom grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top repos */}
        {topRepos.length > 0 && (
          <Card className="border-2 border-[rgba(99,228,224,0.2)]">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">TOP REPOS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topRepos.map((repo) => (
                <Link key={repo.name} href={repo.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start justify-between gap-2 brutal-border brutal-hover p-3 bg-[#1e3040]">
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-xs uppercase flex items-center gap-1.5 text-white">
                      <GitBranch className="h-3.5 w-3.5 shrink-0 text-[#63e4e0]" />
                      {repo.name}
                    </p>
                    {repo.description && <p className="font-mono text-[10px] text-white/40 mt-0.5 truncate">{repo.description}</p>}
                    {repo.language && <Badge variant="outline" className="font-mono text-[10px] mt-1.5 border-[#63e4e0]/30 text-[#63e4e0]">{repo.language}</Badge>}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-white/40 shrink-0">
                    <Star className="h-3 w-3" />{repo.stars}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* LeetCode card */}
        {lc && (
          <Card className="border-2 border-[rgba(99,228,224,0.2)]">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">LEETCODE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between font-mono text-xs uppercase">
                <span className="text-white/40">Rating</span>
                <span className="font-bold text-white">{lc.rating ?? "UNRATED"}</span>
              </div>
              <div className="flex justify-between font-mono text-xs uppercase">
                <span className="text-white/40">Problems Solved</span>
                <span className="font-bold text-white">{lc.problems_solved}</span>
              </div>
              <div className="space-y-2">
                {([["EASY", lc.easy_count, "text-green-400"], ["MED", lc.medium_count, "text-yellow-400"], ["HARD", lc.hard_count, "text-red-400"]] as const).map(([label, count, color]) => (
                  <div key={label} className="flex items-center gap-2 font-mono text-[10px] uppercase">
                    <span className={`w-10 shrink-0 ${color}`}>{label}</span>
                    <Progress value={(count / totalProblems) * 100} className="flex-1 h-1.5" />
                    <span className="text-white/40 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-mono text-xs uppercase">
                <span className="text-white/40">Contests</span>
                <span className="text-white">{lc.contests_participated}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Codeforces card */}
        {cf && (
          <Card className="border-2 border-[rgba(99,228,224,0.2)]">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">CODEFORCES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["RATING", cf.rating ?? "UNRATED"],
                ["MAX RATING", cf.max_rating ?? "---"],
                ["RANK", cf.rank ?? "UNRATED"],
                ["CONTESTS", cf.contests_participated],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between font-mono text-xs uppercase">
                  <span className="text-white/40">{label}</span>
                  <span className="font-bold text-white">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Challenge history */}
        {recentChallenges.length > 0 && (
          <Card className="border-2 border-[rgba(99,228,224,0.2)]">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">CHALLENGE HISTORY</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentChallenges.map((c) => {
                  const opponentId = c.challenger_id === user.id ? c.opponent_id : c.challenger_id;
                  const result = c.winner_id === null ? "draw" : c.winner_id === user.id ? "win" : "loss";
                  const pts = result === "draw" ? 0 : result === "win" ? c.points_wagered : -c.points_wagered;
                  return (
                    <li key={c.id} className="flex items-center justify-between font-mono text-xs uppercase">
                      <div>
                        <span className="font-bold text-white">VS @{opponentMap.get(opponentId) ?? "?"}</span>
                        <span className="text-white/30 ml-2">{c.contest_name}</span>
                      </div>
                      <span className={pts > 0 ? "text-green-400 font-bold" : pts < 0 ? "text-red-400 font-bold" : "text-white/40"}>
                        {pts > 0 ? `+${pts}` : pts === 0 ? "DRAW" : pts} SP
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
