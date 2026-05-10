"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LeaderboardCategory, LeaderboardUser } from "@/lib/queries/leaderboard";

const BADGE_EMOJI: Record<string, string> = {
  "commit-king": "👑",
  "duelist": "⚔️",
  "arena-king": "⚔️",
  "cf-king": "🔵",
  "lc-king": "🟡",
  "alumni-legend": "🎓",
};

interface Props {
  users: LeaderboardUser[];
  total: number;
  page: number;
  pageSize?: number;
  category: LeaderboardCategory;
}

function secondaryValue(user: LeaderboardUser, category: LeaderboardCategory): string {
  if (category === "arena") {
    return `${user.challenge_wins}W / ${user.challenge_losses}L / ${user.challenge_draws}D`;
  }
  if (category === "builders") {
    return `${user.weekly_commits} contributions this week`;
  }
  if (category === "leetcode") {
    return `${user.leetcode_rating ?? "unrated"} rating`;
  }
  return `${user.codeforces_rating ?? "unrated"} rating`;
}

export function LeaderboardTable({ users, total, page, pageSize = 25, category }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No users found.</p>;
  }

  return (
    <div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 hidden md:table-cell">Dept</th>
              <th className="px-4 py-3 hidden sm:table-cell">Year</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Contrib</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">LC</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">CF</th>
              <th className="px-4 py-3 text-right hidden lg:table-cell">Arena</th>
              <th className="px-4 py-3 hidden lg:table-cell">Badges</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => router.push(`/u/${user.username}`)}
              >
                <td className="px-4 py-3 font-mono text-muted-foreground">{user.rank}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{user.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[140px]">
                        {user.full_name}
                        {user.is_alumni && " 🎓"}
                      </p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs max-w-[120px] truncate">
                  {user.department ?? "—"}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                  {user.is_alumni ? "Alumni" : user.college_year ? `Y${user.college_year}` : "—"}
                </td>
                <td className="px-4 py-3 text-right font-semibold" style={{ color: "#63e4e0" }}>
                  <div>{user.score.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {secondaryValue(user, category)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell text-muted-foreground">
                  {user.monthly_commits} mo / {user.weekly_commits} wk
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                  {user.leetcode_rating ?? "—"}
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                  {user.codeforces_rating ?? "—"}
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground">
                  {secondaryValue(user, "arena")}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex items-center gap-0.5">
                    {user.badges.slice(0, 3).map((b) => (
                      <Tooltip key={b.slug}>
                        <TooltipTrigger>
                          <span className="text-base cursor-default">
                            {b.icon_url ? (
                              <img src={b.icon_url} alt={b.name} className="h-5 w-5" />
                            ) : (
                              BADGE_EMOJI[b.slug] ?? "🏅"
                            )}
                          </span>
                          {b.count > 1 && (
                            <span className="text-[10px] font-mono text-muted-foreground">x{b.count}</span>
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-0.5">
                            <p>{b.name}{b.count > 1 ? ` x${b.count}` : ""}</p>
                            {b.awardLabels.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {b.awardLabels.join(", ")}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {user.badges.length > 3 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        +{user.badges.length - 3}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <p>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1}
              onClick={() => goToPage(page - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
