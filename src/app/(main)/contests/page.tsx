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
  const now = Date.now();
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
        <h1 className="text-2xl font-bold">Upcoming Contests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          LeetCode and Codeforces contests — challenge a friend before they start
        </p>
      </div>

      {allContests.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12 text-center">No upcoming contests found.</p>
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
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-4">My Active Challenges</h2>
            <div className="space-y-3">
              {activeChallenges.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-4 text-sm">
                  <p className="font-medium">{c.contest_name}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {c.platform} · {c.points_wagered} SP wagered · ends{" "}
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
