import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, lt, isNotNull } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cronAuth";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Users whose graduation_year is strictly before the current UTC year
  const currentUTCYear = new Date().getUTCFullYear();

  const updated = await db
    .update(users)
    .set({ is_alumni: true, updated_at: new Date() })
    .where(
      and(
        isNotNull(users.graduation_year),
        lt(users.graduation_year, currentUTCYear),
        eq(users.is_alumni, false),
      ),
    )
    .returning({ id: users.id, username: users.username });

  console.log(
    `[check-alumni] Marked ${updated.length} users as alumni (graduation_year < ${currentUTCYear})`,
  );

  return Response.json({ success: true, processed: updated.length });
}
