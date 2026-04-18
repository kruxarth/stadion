import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, or, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, githubStats, leetcodeStats, codeforcesStats, challenges } from "@/lib/db/schema";
import { ensureUser } from "@/lib/ensureUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { GitCommitHorizontal, Trophy, Code2, Swords, ExternalLink, AlertCircle } from "lucide-react";
import { PendingChallenges } from "./_components/PendingChallenges";
import { ActiveChallenges } from "./_components/ActiveChallenges";
import { ContributionHeatmap } from "@/components/profile/ContributionHeatmap";
import { PlatformHeatmap } from "@/components/profile/PlatformHeatmap";
import type { ContributionDay } from "@/lib/github";

export const metadata = { title: "Dashboard — Stadion" };

export default async function DashboardPage() {
  const user = await ensureUser();
  if (!user) redirect("/");

  const [gh, lc, cf, pendingChallenges, activeChallenges, rankResult] = await Promise.all([
    db.query.githubStats.findFirst({ where: eq(githubStats.user_id, user.id) }),
    db.query.leetcodeStats.findFirst({ where: eq(leetcodeStats.user_id, user.id) }),
    db.query.codeforcesStats.findFirst({ where: eq(codeforcesStats.user_id, user.id) }),
    db.select().from(challenges).where(
      and(eq(challenges.opponent_id, user.id), eq(challenges.status, "pending")),
    ),
    db.select().from(challenges).where(
      and(
        or(eq(challenges.challenger_id, user.id), eq(challenges.opponent_id, user.id)),
        eq(challenges.status, "accepted"),
      ),
    ),
    db.select({ count: sql<number>`COUNT(*)` }).from(users)
      .where(sql`${users.stadion_points} > ${user.stadion_points}`),
  ]);

  const currentRank = Number(rankResult[0]?.count ?? 0) + 1;
  const needsLinking = !user.leetcode_username || !user.codeforces_handle;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-[#63e4e0]">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="font-mono font-bold bg-[#1e3040]">{user.full_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-mono font-black text-xl uppercase tracking-tight text-white">
              {user.full_name}
            </h1>
            <p className="font-mono text-xs text-[#63e4e0]">@{user.username}</p>
          </div>
        </div>
      </div>

      {/* Linking banner */}
      {needsLinking && (
        <div className="brutal-border flex items-start gap-3 bg-[#293a4e] px-4 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-400" />
          <span className="font-mono text-xs uppercase tracking-wider text-white/60">
            Link your {!user.leetcode_username && "LeetCode"}
            {!user.leetcode_username && !user.codeforces_handle && " + "}
            {!user.codeforces_handle && "Codeforces"} in{" "}
            <Link href="/settings" className="text-[#63e4e0] underline">SETTINGS</Link>{" "}
            to earn more SP.
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: "RANK", value: `#${currentRank}` },
          { icon: Swords, label: "STADION PTS", value: user.stadion_points.toLocaleString() },
          { icon: GitCommitHorizontal, label: "COMMITS /WK", value: String(gh?.weekly_commits ?? "---") },
          { icon: Code2, label: "LC RATING", value: String(lc?.rating ?? "---") },
        ].map((s) => (
          <div key={s.label} className="brutal-border bg-[#293a4e] p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-3.5 w-3.5 text-[#63e4e0]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                {s.label}
              </span>
            </div>
            <p className="font-mono font-black text-2xl text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending challenges */}
        <Card className="border-2 border-[rgba(99,228,224,0.2)]">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">
              INCOMING CHALLENGES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendingChallenges challenges={pendingChallenges} currentUserId={user.id} />
          </CardContent>
        </Card>

        {/* Active challenges */}
        <Card className="border-2 border-[rgba(99,228,224,0.2)]">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">
              ACTIVE CHALLENGES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActiveChallenges challenges={activeChallenges} currentUserId={user.id} />
          </CardContent>
        </Card>
      </div>

      {/* Heatmaps */}
      <div className="space-y-4">
        {(() => {
          const ghData = (gh?.contribution_data ?? []) as ContributionDay[];
          return ghData.length > 0 ? (
            <Card className="border-2 border-[rgba(99,228,224,0.2)]">
              <CardHeader className="pb-3">
                <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">
                  GITHUB CONTRIBUTIONS
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ContributionHeatmap data={ghData} />
              </CardContent>
            </Card>
          ) : null;
        })()}
        {user.leetcode_username && (
          <Card className="border-2 border-[rgba(99,228,224,0.2)]">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">
                LEETCODE ACTIVITY
              </CardTitle>
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
        {user.codeforces_handle && (
          <Card className="border-2 border-[rgba(99,228,224,0.2)]">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">
                CODEFORCES ACTIVITY
              </CardTitle>
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
      </div>

      <Separator className="bg-[#63e4e0]/20" />

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        {[
          { href: `/u/${user.username}`, icon: ExternalLink, label: "VIEW PROFILE" },
          { href: "/leaderboard", icon: Trophy, label: "RANKINGS" },
          { href: "/contests", icon: Swords, label: "CONTESTS" },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <button className="brutal-border brutal-hover bg-transparent text-[#63e4e0] font-mono font-bold text-[10px] uppercase tracking-wider px-4 py-2 flex items-center gap-2 cursor-pointer">
              <link.icon className="h-3.5 w-3.5" /> {link.label}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
