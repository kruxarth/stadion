import { fetchCodeforcesSubmissionCalendar } from "@/lib/codeforces";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const data = await fetchCodeforcesSubmissionCalendar(handle);
  return Response.json(data);
}
