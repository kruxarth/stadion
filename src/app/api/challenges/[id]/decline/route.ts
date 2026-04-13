import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUser } from "@/lib/ensureUser";

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
    return Response.json({ error: "Only the opponent can decline this challenge" }, { status: 403 });
  }
  if (challenge.status !== "pending") {
    return Response.json({ error: "Challenge is no longer pending" }, { status: 400 });
  }

  const [updated] = await db
    .update(challenges)
    .set({ status: "declined", updated_at: new Date() })
    .where(eq(challenges.id, id))
    .returning();

  return Response.json(updated);
}
