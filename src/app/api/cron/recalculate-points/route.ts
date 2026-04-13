import { db } from "@/lib/db";
import { users, githubStats, leetcodeStats, codeforcesStats, stadionPointsLog } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { calculateStatScore } from "@/lib/scoring";
import { verifyCronAuth } from "@/lib/cronAuth";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Single query: all users joined with their stats
  const usersWithStats = await db
    .select({
      id: users.id,
      github: {
        weekly_commits: githubStats.weekly_commits,
        monthly_commits: githubStats.monthly_commits,
      },
      lc: {
        rating: leetcodeStats.rating,
        problems_solved: leetcodeStats.problems_solved,
      },
      cf: {
        rating: codeforcesStats.rating,
      },
    })
    .from(users)
    .leftJoin(githubStats, eq(githubStats.user_id, users.id))
    .leftJoin(leetcodeStats, eq(leetcodeStats.user_id, users.id))
    .leftJoin(codeforcesStats, eq(codeforcesStats.user_id, users.id));

  // Single query: aggregate all log deltas per user
  const logSumsRows = await db
    .select({
      user_id: stadionPointsLog.user_id,
      total: sql<number>`COALESCE(SUM(${stadionPointsLog.delta}), 0)`.as("total"),
    })
    .from(stadionPointsLog)
    .groupBy(stadionPointsLog.user_id);

  const logSumMap = new Map<string, number>(
    logSumsRows.map((r) => [r.user_id, Number(r.total)]),
  );

  console.log(`[recalculate-points] Recalculating for ${usersWithStats.length} users`);

  let processed = 0;

  for (const row of usersWithStats) {
    const gh = row.github;
    const lc = row.lc;
    const cf = row.cf;

    const statScore = calculateStatScore(
      gh?.weekly_commits != null
        ? { weekly_commits: gh.weekly_commits, monthly_commits: gh.monthly_commits ?? 0 }
        : null,
      lc?.problems_solved != null
        ? { rating: lc.rating ?? null, problems_solved: lc.problems_solved }
        : null,
      cf?.rating != null ? { rating: cf.rating } : null,
    );

    const logDelta = logSumMap.get(row.id) ?? 0;
    const finalPoints = statScore + logDelta;

    await db
      .update(users)
      .set({ stadion_points: finalPoints, updated_at: new Date() })
      .where(eq(users.id, row.id));

    processed++;
  }

  console.log(`[recalculate-points] Done. Updated ${processed} users`);
  return Response.json({ success: true, processed });
}
