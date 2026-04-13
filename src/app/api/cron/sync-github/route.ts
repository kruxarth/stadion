import { db } from "@/lib/db";
import { users, githubStats } from "@/lib/db/schema";
import { isNotNull, eq } from "drizzle-orm";
import { fetchGitHubStats, getGitHubRateLimit } from "@/lib/github";
import { verifyCronAuth } from "@/lib/cronAuth";

// Stop fetching if fewer than this many requests remain in the rate limit bucket
const RATE_LIMIT_BUFFER = 100;

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db
    .select({ id: users.id, github_username: users.github_username })
    .from(users)
    .where(isNotNull(users.github_username));

  console.log(`[sync-github] Processing ${allUsers.length} users`);

  let processed = 0;

  for (const user of allUsers) {
    // Check rate limit before each batch starts
    const rateLimit = await getGitHubRateLimit();
    if (rateLimit.remaining < RATE_LIMIT_BUFFER) {
      console.log(
        `[sync-github] Rate limit low (${rateLimit.remaining} remaining). Stopping. Resets at ${rateLimit.resetAt}`,
      );
      break;
    }

    const stats = await fetchGitHubStats(user.github_username);
    if (!stats) {
      console.warn(`[sync-github] No stats for ${user.github_username}`);
      continue;
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

    console.log(
      `[sync-github] ${user.github_username}: ${stats.weekly_commits} weekly, ${stats.monthly_commits} monthly`,
    );
    processed++;
  }

  console.log(`[sync-github] Done. Processed ${processed}/${allUsers.length}`);
  return Response.json({ success: true, processed });
}
