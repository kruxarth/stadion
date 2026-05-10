import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { getLeaderboard, type LeaderboardCategory } from "@/lib/queries/leaderboard";
import { LeaderboardControls } from "./_components/LeaderboardControls";
import type { LeaderboardProgramFilter, LeaderboardYearFilter } from "@/lib/queries/leaderboard";

export const metadata = { title: "Leaderboard — Stadion" };

type SearchParams = Promise<{ tab?: string; year?: string; program?: string; page?: string }>;

export default async function LeaderboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const allowedTabs: LeaderboardCategory[] = ["builders", "leetcode", "codeforces", "arena"];
  const allowedYears: LeaderboardYearFilter[] = ["all", "1", "2", "3", "4", "alumni"];
  const allowedPrograms: LeaderboardProgramFilter[] = ["all", "btech", "mtech", "mca"];
  const tab = allowedTabs.includes(params.tab as LeaderboardCategory)
    ? params.tab as LeaderboardCategory
    : "builders";
  const year = allowedYears.includes(params.year as LeaderboardYearFilter)
    ? params.year as LeaderboardYearFilter
    : "all";
  const program = allowedPrograms.includes(params.program as LeaderboardProgramFilter)
    ? params.program as LeaderboardProgramFilter
    : "all";
  const requestedPage = Number(params.page ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const { users, total } = await getLeaderboard(tab, year, page, 25, program);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <div className="h-[2px] w-8 bg-[#63e4e0]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#63e4e0]">
            RANKINGS
          </span>
        </div>
        <h1 className="font-mono font-black text-2xl uppercase tracking-tight text-white">
          LEADERBOARD
        </h1>
        <p className="font-mono text-xs uppercase tracking-wider text-white/40 mt-1">
          Builders, LeetCoders, Codeforces toppers, and Arena records
        </p>
      </div>

      {/* Tab + filter controls — client component for URL updates */}
      <LeaderboardControls currentTab={tab} currentYear={year} currentProgram={program} />

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <LeaderboardTable
          users={users}
          total={total}
          page={page}
          category={tab}
        />
      </Suspense>
    </div>
  );
}
