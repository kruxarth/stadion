import { getTopLeaderboard } from "@/lib/queries/leaderboard";

export const revalidate = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "5"), 100);

  try {
    const users = await getTopLeaderboard(limit);
    return Response.json(users, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[leaderboard/top]", err);
    return Response.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
