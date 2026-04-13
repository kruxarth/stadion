import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { challenges, users } from "@/lib/db/schema";
import { eq, or, and, sql } from "drizzle-orm";
import { ensureUser } from "@/lib/ensureUser";

async function getAvailablePoints(userId: string): Promise<number> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { stadion_points: true },
  });

  const reserved = await db
    .select({ total: sql<number>`COALESCE(SUM(${challenges.points_wagered}), 0)` })
    .from(challenges)
    .where(
      and(
        or(eq(challenges.challenger_id, userId), eq(challenges.opponent_id, userId)),
        eq(challenges.status, "accepted"),
      ),
    );

  return (user?.stadion_points ?? 0) - Number(reserved[0]?.total ?? 0);
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, clerkId) });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const userChallenges = await db
    .select()
    .from(challenges)
    .where(
      and(
        or(eq(challenges.challenger_id, user.id), eq(challenges.opponent_id, user.id)),
        sql`${challenges.status} IN ('pending', 'accepted')`,
      ),
    );

  return Response.json(userChallenges);
}

export async function POST(request: Request) {
  const user = await ensureUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    opponent_id: string;
    platform: string;
    contest_id: string;
    contest_name: string;
    contest_start: string;
    contest_end: string;
    points_wagered: number;
  };

  const { opponent_id, platform, contest_id, contest_name, contest_start, contest_end, points_wagered } = body;

  if (opponent_id === user.id) {
    return Response.json({ error: "You cannot challenge yourself" }, { status: 400 });
  }
  if (!["leetcode", "codeforces"].includes(platform)) {
    return Response.json({ error: "Invalid platform" }, { status: 400 });
  }
  if (![25, 50, 100, 150].includes(points_wagered)) {
    return Response.json({ error: "Invalid wager amount" }, { status: 400 });
  }
  if (new Date(contest_start) <= new Date()) {
    return Response.json({ error: "Contest has already started" }, { status: 400 });
  }

  const available = await getAvailablePoints(user.id);
  if (available < points_wagered) {
    return Response.json({ error: "Insufficient available points" }, { status: 400 });
  }

  const [challenge] = await db
    .insert(challenges)
    .values({
      challenger_id: user.id,
      opponent_id,
      platform,
      contest_id,
      contest_name,
      contest_start: new Date(contest_start),
      contest_end: new Date(contest_end),
      points_wagered,
    })
    .returning();

  return Response.json(challenge, { status: 201 });
}
