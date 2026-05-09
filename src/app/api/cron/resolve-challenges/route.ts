import { resolveEndedChallenges } from "@/lib/challenges/resolve";
import { verifyCronAuth } from "@/lib/cronAuth";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await resolveEndedChallenges();
  return Response.json({ success: true, processed: result.processed });
}
