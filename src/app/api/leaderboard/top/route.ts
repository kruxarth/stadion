import { getTopLeaderboard } from "@/lib/queries/leaderboard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "5"), 100);

  try {
    const users = await getTopLeaderboard(limit);
    return Response.json(users);
  } catch (err) {
    console.error("[leaderboard/top]", err);
    return Response.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
