import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, or, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, githubStats, leetcodeStats, codeforcesStats, challenges } from "@/lib/db/schema";
import { ensureUser } from "@/lib/ensureUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GitCommitHorizontal, Trophy, Code2, Swords, Settings, ExternalLink, AlertCircle } from "lucide-react";
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
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback>{user.full_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{user.full_name}</h1>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Settings
          </Button>
        </Link>
      </div>

      {/* Linking banner */}
      {needsLinking && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Link your {!user.leetcode_username && "LeetCode"}
            {!user.leetcode_username && !user.codeforces_handle && " and "}
            {!user.codeforces_handle && "Codeforces"} account in{" "}
            <Link href="/settings" className="underline font-medium">Settings</Link>{" "}
            to earn more Stadion Points.
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: "Rank", value: `#${currentRank}` },
          { icon: Swords, label: "Stadion Points", value: user.stadion_points.toLocaleString() },
          { icon: GitCommitHorizontal, label: "Commits (week)", value: gh?.weekly_commits ?? "—" },
          { icon: Code2, label: "LC Rating", value: lc?.rating ?? "—" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending challenges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Incoming Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingChallenges challenges={pendingChallenges} currentUserId={user.id} />
          </CardContent>
        </Card>

        {/* Active challenges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Challenges</CardTitle>
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
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">GitHub Contributions</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <ContributionHeatmap data={ghData} />
              </CardContent>
            </Card>
          ) : null;
        })()}
        {user.leetcode_username && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">LeetCode Activity</CardTitle></CardHeader>
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
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Codeforces Activity</CardTitle></CardHeader>
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

      <Separator />

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/u/${user.username}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> View Profile
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Leaderboard
          </Button>
        </Link>
        <Link href="/contests">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Swords className="h-3.5 w-3.5" /> Upcoming Contests
          </Button>
        </Link>
      </div>
    </div>
  );
}
