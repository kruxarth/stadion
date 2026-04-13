import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cronAuth";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const expired = await db
    .update(challenges)
    .set({ status: "expired", updated_at: now })
    .where(
      and(
        eq(challenges.status, "pending"),
        lt(challenges.contest_start, now),
      ),
    )
    .returning({ id: challenges.id });

  console.log(`[expire-challenges] Expired ${expired.length} challenges`);
  return Response.json({ success: true, processed: expired.length });
}
