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

  const results: CronStepResult[] = [];

  for (const step of CRON_STEPS) {
    try {
      console.log(`[daily-cron] Running ${step.name}`);
      const response = await step.run(request);
      const body = await readResponseBody(response);

      results.push({
        name: step.name,
        ok: response.ok,
        status: response.status,
        body,
      });

      if (!response.ok) {
        console.error(`[daily-cron] ${step.name} failed with ${response.status}`, body);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[daily-cron] ${step.name} threw`, error);

      results.push({
        name: step.name,
        ok: false,
        status: 500,
        body: { error: message },
      });
    }
  }

  const success = results.every((result) => result.ok);

  return Response.json(
    { success, results },
    { status: success ? 200 : 500 },
  );
}
