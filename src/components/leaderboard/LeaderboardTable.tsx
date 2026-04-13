"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LeaderboardUser } from "@/lib/queries/leaderboard";

const BADGE_EMOJI: Record<string, string> = {
  "commit-king": "👑",
  "leaderboard-legend": "🏆",
  "arena-king": "⚔️",
  "cf-king": "🔵",
  "lc-king": "🟡",
  "alumni-legend": "🎓",
};

function RankChange({ change }: { change: number | null }) {
  if (change === null)
    return <span className="text-xs text-blue-400 font-medium">NEW</span>;
  if (change === 0)
    return <span className="text-xs text-muted-foreground">—</span>;
  if (change > 0)
    return <span className="text-xs text-green-400 font-medium">↑{change}</span>;
  return <span className="text-xs text-red-400 font-medium">↓{Math.abs(change)}</span>;
}

interface Props {
  users: LeaderboardUser[];
  total: number;
  page: number;
  pageSize?: number;
  showRankChange?: boolean;
}

export function LeaderboardTable({ users, total, page, pageSize = 25, showRankChange = false }: Props) {
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
              {showRankChange && <th className="px-2 py-3 w-12" />}
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 hidden md:table-cell">Dept</th>
              <th className="px-4 py-3 hidden sm:table-cell">Year</th>
              <th className="px-4 py-3 text-right">SP</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Commits</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">LC</th>
              <th className="px-4 py-3 text-right hidden md:table-cell">CF</th>
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
                {showRankChange && (
                  <td className="px-2 py-3">
                    <RankChange change={user.rankChange} />
                  </td>
                )}
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
                  {user.stadion_points.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell text-muted-foreground">
                  {user.weekly_commits}
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                  {user.leetcode_rating ?? "—"}
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                  {user.codeforces_rating ?? "—"}
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
                        </TooltipTrigger>
                        <TooltipContent>{b.name}</TooltipContent>
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
