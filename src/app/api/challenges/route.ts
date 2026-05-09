import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { challenges, users } from "@/lib/db/schema";
import { eq, or, and, sql } from "drizzle-orm";
import { ensureUser } from "@/lib/ensureUser";
import { fetchUpcomingLeetCodeContests } from "@/lib/leetcode";
import { fetchUpcomingCodeforcesContests } from "@/lib/codeforces";
import { resolveEndedChallenges } from "@/lib/challenges/resolve";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.users.findFirst({ where: eq(users.clerk_id, clerkId) });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  await resolveEndedChallenges({ userId: user.id, limit: 10 });

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
  };

  const { opponent_id, platform, contest_id, contest_name, contest_start, contest_end } = body;
  const contestStart = new Date(contest_start);
  const contestEnd = new Date(contest_end);

  if (opponent_id === user.id) {
    return Response.json({ error: "You cannot challenge yourself" }, { status: 400 });
  }
  if (!["leetcode", "codeforces"].includes(platform)) {
    return Response.json({ error: "Invalid platform" }, { status: 400 });
  }
  if (Number.isNaN(contestStart.getTime()) || Number.isNaN(contestEnd.getTime())) {
    return Response.json({ error: "Invalid contest time" }, { status: 400 });
  }
  if (contestEnd <= contestStart) {
    return Response.json({ error: "Contest end must be after contest start" }, { status: 400 });
  }
  if (contestStart <= new Date()) {
    return Response.json({ error: "Contest has already started" }, { status: 400 });
  }

  const opponent = await db.query.users.findFirst({
    where: eq(users.id, opponent_id),
    columns: {
      id: true,
      leetcode_username: true,
      codeforces_handle: true,
    },
  });

  if (!opponent) {
    return Response.json({ error: "Opponent not found" }, { status: 404 });
  }

  if (platform === "leetcode") {
    if (!user.leetcode_username || !opponent.leetcode_username) {
      return Response.json({ error: "Both users must link LeetCode usernames" }, { status: 400 });
    }

    const contest = (await fetchUpcomingLeetCodeContests()).find(
      (c) => c.titleSlug === contest_id,
    );
    if (!contest) {
      return Response.json({ error: "Contest not found in upcoming LeetCode contests" }, { status: 400 });
    }
    const expectedStart = new Date(contest.startTime * 1000);
    const expectedEnd = new Date((contest.startTime + contest.duration) * 1000);
    if (
      contest_name !== contest.title ||
      contestStart.getTime() !== expectedStart.getTime() ||
      contestEnd.getTime() !== expectedEnd.getTime()
    ) {
      return Response.json({ error: "Contest details do not match LeetCode" }, { status: 400 });
    }
  } else {
    if (!user.codeforces_handle || !opponent.codeforces_handle) {
      return Response.json({ error: "Both users must link Codeforces handles" }, { status: 400 });
    }

    const contest = (await fetchUpcomingCodeforcesContests()).find(
      (c) => String(c.id) === contest_id,
    );
    if (!contest) {
      return Response.json({ error: "Contest not found in upcoming Codeforces contests" }, { status: 400 });
    }
    const expectedStart = new Date(contest.startTimeSeconds * 1000);
    const expectedEnd = new Date((contest.startTimeSeconds + contest.durationSeconds) * 1000);
    if (
      contest_name !== contest.name ||
      contestStart.getTime() !== expectedStart.getTime() ||
      contestEnd.getTime() !== expectedEnd.getTime()
    ) {
      return Response.json({ error: "Contest details do not match Codeforces" }, { status: 400 });
    }
  }

  const [challenge] = await db
    .insert(challenges)
    .values({
      challenger_id: user.id,
      opponent_id,
      platform,
      contest_id,
      contest_name,
      contest_start: contestStart,
      contest_end: contestEnd,
    })
    .returning();

  return Response.json(challenge, { status: 201 });
}
