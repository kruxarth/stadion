import { fetchLeetCodeSubmissionCalendar } from "@/lib/leetcode";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const data = await fetchLeetCodeSubmissionCalendar(username);
  return Response.json(data);
}
