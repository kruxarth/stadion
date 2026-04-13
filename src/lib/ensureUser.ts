import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/lib/db/schema";

/**
 * Upserts the authenticated Clerk user into the users table.
 *
 * Called on every authenticated server request to guard against the Clerk
 * webhook (user.created) not having fired yet. Safe to call multiple times —
 * it only inserts if the row doesn't exist, otherwise returns the existing row.
 *
 * Returns null if no Clerk session is active.
 */
export async function ensureUser(): Promise<User | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // GitHub is the only OAuth provider — always present after sign-in
  const githubAccount = clerkUser.externalAccounts.find(
    (account) => account.provider === "github",
  );
  const githubUsername =
    githubAccount?.username ??
    clerkUser.username ??
    clerkUser.id; // last-resort fallback (should never happen)

  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    githubUsername;

  const existing = await db.query.users.findFirst({
    where: eq(users.clerk_id, clerkUser.id),
  });

  if (existing) return existing;

  // Webhook hasn't fired yet — insert the row now
  const [newUser] = await db
    .insert(users)
    .values({
      clerk_id: clerkUser.id,
      username: githubUsername,
      full_name: fullName,
      avatar_url: clerkUser.imageUrl ?? null,
      github_username: githubUsername,
    })
    .onConflictDoUpdate({
      // If a concurrent request already inserted, return the existing row
      target: users.clerk_id,
      set: {
        avatar_url: clerkUser.imageUrl ?? null,
        updated_at: new Date(),
      },
    })
    .returning();

  return newUser;
}
