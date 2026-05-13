import { GET as awardBadges } from "@/app/api/cron/award-badges/route";
import { GET as checkAlumni } from "@/app/api/cron/check-alumni/route";
import { GET as expireChallenges } from "@/app/api/cron/expire-challenges/route";
import { GET as resolveChallenges } from "@/app/api/cron/resolve-challenges/route";
import { GET as syncCodeforces } from "@/app/api/cron/sync-codeforces/route";
import { GET as syncGitHub } from "@/app/api/cron/sync-github/route";
import { GET as syncLeetCode } from "@/app/api/cron/sync-leetcode/route";
import { verifyCronAuth } from "@/lib/cronAuth";

type CronStep = {
  name: string;
  run: (request: Request) => Promise<Response>;
};

type CronStepResult = {
  name: string;
  ok: boolean;
  status: number;
  body: unknown;
};

const CRON_STEPS: CronStep[] = [
  { name: "expire-challenges", run: expireChallenges },
  { name: "resolve-challenges", run: resolveChallenges },
  { name: "sync-github", run: syncGitHub },
  { name: "sync-leetcode", run: syncLeetCode },
  { name: "sync-codeforces", run: syncCodeforces },
  { name: "check-alumni", run: checkAlumni },
  { name: "award-badges", run: awardBadges },
];

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[daily-cron] Running ${CRON_STEPS.length} steps in parallel`);

  const results = await Promise.allSettled(
    CRON_STEPS.map(async (step) => {
      const start = Date.now();
      try {
        console.log(`[daily-cron] Running ${step.name}`);
        const response = await step.run(request);
        const body = await readResponseBody(response);
        const elapsed = Date.now() - start;

        console.log(`[daily-cron] ${step.name} completed in ${elapsed}ms`);

        if (!response.ok) {
          console.error(`[daily-cron] ${step.name} failed with ${response.status}`, body);
        }

        return { name: step.name, ok: response.ok, status: response.status, body };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[daily-cron] ${step.name} threw after ${Date.now() - start}ms`, error);
        return { name: step.name, ok: false, status: 500, body: { error: message } };
      }
    }),
  );

  const stepResults: CronStepResult[] = results.map((r) =>
    r.status === "fulfilled" ? r.value : { name: "unknown", ok: false, status: 500, body: { error: r.reason?.message ?? "Unknown" } },
  );

  const success = stepResults.every((r) => r.ok);

  console.log(`[daily-cron] Done. ${stepResults.filter((r) => r.ok).length}/${stepResults.length} steps succeeded`);

  return Response.json(
    { success, results: stepResults },
    { status: success ? 200 : 500 },
  );
}
