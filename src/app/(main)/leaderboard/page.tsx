import { Suspense } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { getLeaderboard } from "@/lib/queries/leaderboard";
import { LeaderboardControls } from "./_components/LeaderboardControls";

export const metadata = { title: "Leaderboard — Stadion" };

type SearchParams = Promise<{ tab?: string; year?: string; page?: string }>;

export default async function LeaderboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tab = (params.tab ?? "all-time") as "weekly" | "monthly" | "all-time";
  const year = (params.year ?? "all") as "all" | "1" | "2" | "3" | "4" | "alumni";
  const page = Math.max(1, Number(params.page ?? "1"));

  const { users, total } = await getLeaderboard(tab, year, page, 25);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Rankings across all registered members</p>
      </div>

      {/* Tab + filter controls — client component for URL updates */}
      <LeaderboardControls currentTab={tab} currentYear={year} />

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <LeaderboardTable
          users={users}
          total={total}
          page={page}
          showRankChange={tab === "all-time"}
        />
      </Suspense>
    </div>
  );
}
