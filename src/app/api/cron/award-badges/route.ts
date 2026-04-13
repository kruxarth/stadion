import { evaluateAllBadges } from "@/lib/badges";
import { verifyCronAuth } from "@/lib/cronAuth";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[award-badges] Starting badge evaluation");
  const awarded = await evaluateAllBadges();
  console.log(`[award-badges] Done. ${awarded} badge(s) awarded`);

  return Response.json({ success: true, processed: awarded });
}
