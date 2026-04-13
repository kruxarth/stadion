import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// Returns all users for the challenge modal user-picker (authenticated only)
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      full_name: users.full_name,
      avatar_url: users.avatar_url,
      department: users.department,
      college_year: users.college_year,
    })
    .from(users)
    .orderBy(users.full_name);

  return Response.json(allUsers);
}
