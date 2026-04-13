/**
 * Verifies that an incoming request carries the correct CRON_SECRET.
 * All cron route handlers must call this before doing any work.
 */
export function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("Authorization");
  return auth === `Bearer ${secret}`;
}
