import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, challenges } from "@/lib/db/schema";
import { eq, or, and, sql } from "drizzle-orm";
import { fetchUpcomingLeetCodeContests } from "@/lib/leetcode";
import { fetchUpcomingCodeforcesContests } from "@/lib/codeforces";
import { ContestCard } from "@/components/contests/ContestCard";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Contests — Stadion" };
export const revalidate = 300; // re-fetch every 5 minutes

export default async function ContestsPage() {
  const { userId: clerkId } = await auth();

  // Fetch contests from both platforms in parallel
  const [lcContests, cfContests] = await Promise.all([
    fetchUpcomingLeetCodeContests().catch(() => []),
    fetchUpcomingCodeforcesContests().catch(() => []),
  ]);

  // Build unified, sorted list
  const allContests = [
    ...lcContests.map((c) => ({
      platform: "leetcode" as const,
      name: c.title,
      slug: c.titleSlug,
      startTime: new Date(c.startTime * 1000),
      endTime: new Date((c.startTime + c.duration) * 1000),
    })),
    ...cfContests.map((c) => ({
      platform: "codeforces" as const,
      name: c.name,
      slug: String(c.id),
      startTime: new Date(c.startTimeSeconds * 1000),
      endTime: new Date((c.startTimeSeconds + c.durationSeconds) * 1000),
    })),
  ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Get current user's context for the challenge button
  let currentUserId: string | undefined;
  let currentUserPoints = 0;
  let currentUserAvailablePoints = 0;
  let activeChallenges: typeof challenges.$inferSelect[] = [];

  if (clerkId) {
    const user = await db.query.users.findFirst({ where: eq(users.clerk_id, clerkId) });
    if (user) {
      currentUserId = user.id;
      currentUserPoints = user.stadion_points;

      const reserved = await db
        .select({ total: sql<number>`COALESCE(SUM(${challenges.points_wagered}), 0)` })
        .from(challenges)
        .where(
          and(
            or(eq(challenges.challenger_id, user.id), eq(challenges.opponent_id, user.id)),
            eq(challenges.status, "accepted"),
          ),
        );
      const reservedPoints = Number(reserved[0]?.total ?? 0);
      currentUserAvailablePoints = user.stadion_points - reservedPoints;

      activeChallenges = await db.select().from(challenges).where(
        and(
          or(eq(challenges.challenger_id, user.id), eq(challenges.opponent_id, user.id)),
          eq(challenges.status, "accepted"),
        ),
      );
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <div className="h-[2px] w-8 bg-[#63e4e0]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#63e4e0]">
            ARENA
          </span>
        </div>
        <h1 className="font-mono font-black text-2xl uppercase tracking-tight text-white">
          UPCOMING CONTESTS
        </h1>
        <p className="font-mono text-xs uppercase tracking-wider text-white/40 mt-1">
          LeetCode + Codeforces // challenge someone before they start
        </p>
      </div>

      {allContests.length === 0 ? (
        <p className="font-mono text-xs uppercase tracking-wider text-white/30 py-12 text-center">
          No upcoming contests found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allContests.map((c) => (
            <ContestCard
              key={`${c.platform}-${c.slug}`}
              platform={c.platform}
              name={c.name}
              slug={c.slug}
              startTime={c.startTime}
              endTime={c.endTime}
              currentUserId={currentUserId}
              currentUserPoints={currentUserPoints}
              currentUserAvailablePoints={currentUserAvailablePoints}
            />
          ))}
        </div>
      )}

      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <>
          <Separator className="bg-[#63e4e0]/20" />
          <div>
            <h2 className="font-mono font-bold text-sm uppercase tracking-wider text-white mb-4">
              MY ACTIVE CHALLENGES
            </h2>
            <div className="space-y-3">
              {activeChallenges.map((c) => (
                <div key={c.id} className="brutal-border bg-[#293a4e] p-4">
                  <p className="font-mono font-bold text-sm text-white uppercase">{c.contest_name}</p>
                  <p className="font-mono text-[10px] text-white/40 uppercase tracking-wider mt-1">
                    {c.platform} // {c.points_wagered} SP wagered // ends{" "}
                    {new Date(c.contest_end).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
