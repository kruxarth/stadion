import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// Clerk webhook event types (only the fields we use)
interface ClerkExternalAccount {
  provider: string;
  username?: string;
}

interface ClerkUserCreatedEvent {
  type: "user.created";
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    external_accounts: ClerkExternalAccount[];
  };
}

type ClerkWebhookEvent = ClerkUserCreatedEvent;

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // Read raw body for Svix signature verification
  const body = await request.text();
  const headerPayload = await headers();

  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing svix headers" }, { status: 400 });
  }

  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, first_name, last_name, image_url, external_accounts } =
      event.data;

    const githubAccount = external_accounts.find(
      (account) => account.provider === "github",
    );
    const githubUsername = githubAccount?.username;

    if (!githubUsername) {
      // Should never happen — GitHub OAuth is the only provider
      console.error(`user.created: no GitHub account for clerk_id=${id}`);
      return Response.json(
        { error: "No GitHub account found" },
        { status: 422 },
      );
    }

    const fullName =
      [first_name, last_name].filter(Boolean).join(" ") || githubUsername;

    await db
      .insert(users)
      .values({
        clerk_id: id,
        username: githubUsername,
        full_name: fullName,
        avatar_url: image_url ?? null,
        github_username: githubUsername,
      })
      .onConflictDoNothing({ target: users.clerk_id });

    console.log(`user.created: inserted user ${githubUsername} (${id})`);
  }

  return Response.json({ success: true });
}
