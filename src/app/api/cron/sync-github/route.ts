import { db } from "@/lib/db";
import { users, githubStats } from "@/lib/db/schema";
import { isNotNull, eq } from "drizzle-orm";
import { fetchGitHubStats, getGitHubRateLimit } from "@/lib/github";
import { verifyCronAuth } from "@/lib/cronAuth";
import { pMap } from "@/lib/concurrency";

const RATE_LIMIT_BUFFER = 100;
const CONCURRENCY = 5;

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db
    .select({ id: users.id, github_username: users.github_username })
    .from(users)
    .where(isNotNull(users.github_username));

  console.log(`[sync-github] Processing ${allUsers.length} users (concurrency=${CONCURRENCY})`);

  const rateLimit = await getGitHubRateLimit();
  const maxProcess = Math.max(0, rateLimit.remaining - RATE_LIMIT_BUFFER);
  const usersToProcess = allUsers.slice(0, Math.ceil(maxProcess / 2));

  console.log(`[sync-github] Rate limit: ${rateLimit.remaining} remaining, processing ${usersToProcess.length} users`);

  let processed = 0;

  await pMap(usersToProcess, async (user) => {
    const stats = await fetchGitHubStats(user.github_username);
    if (!stats) {
      console.warn(`[sync-github] No stats for ${user.github_username}`);
      return;
    }

    await db
      .insert(githubStats)
      .values({
        user_id: user.id,
        weekly_commits: stats.weekly_commits,
        monthly_commits: stats.monthly_commits,
        top_languages: stats.top_languages,
        contribution_data: stats.contribution_data,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: githubStats.user_id,
        set: {
          weekly_commits: stats.weekly_commits,
          monthly_commits: stats.monthly_commits,
          top_languages: stats.top_languages,
          contribution_data: stats.contribution_data,
          updated_at: new Date(),
        },
      });

    processed++;
  }, CONCURRENCY);

  console.log(`[sync-github] Done. Processed ${processed}/${usersToProcess.length} (skipped ${allUsers.length - usersToProcess.length} due to rate limit)`);
  return Response.json({ success: true, processed, skipped: allUsers.length - usersToProcess.length });
}
