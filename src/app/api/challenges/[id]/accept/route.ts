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

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await ensureUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, id),
  });

  if (!challenge) return Response.json({ error: "Challenge not found" }, { status: 404 });
  if (challenge.opponent_id !== user.id) {
    return Response.json({ error: "Only the opponent can accept this challenge" }, { status: 403 });
  }
  if (challenge.status !== "pending") {
    return Response.json({ error: "Challenge is no longer pending" }, { status: 400 });
  }
  if (new Date(challenge.contest_start) <= new Date()) {
    return Response.json({ error: "Contest has already started" }, { status: 400 });
  }

  // Validate available points for both users
  const [challengerAvailable, opponentAvailable] = await Promise.all([
    getAvailablePoints(challenge.challenger_id),
    getAvailablePoints(user.id),
  ]);

  if (challengerAvailable < challenge.points_wagered) {
    return Response.json({ error: "Challenger no longer has sufficient points" }, { status: 400 });
  }
  if (opponentAvailable < challenge.points_wagered) {
    return Response.json({ error: "You do not have sufficient available points" }, { status: 400 });
  }

  const [updated] = await db
    .update(challenges)
    .set({ status: "accepted", updated_at: new Date() })
    .where(eq(challenges.id, id))
    .returning();

  return Response.json(updated);
}
