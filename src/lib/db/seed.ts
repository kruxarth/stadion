import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { badges } from "./schema";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

// All badge definitions for Stadion.
// criteria is machine-readable documentation — badge evaluation logic lives in src/lib/badges.ts.
const BADGE_DEFINITIONS = [
  {
    slug: "commit-king",
    name: "Commit King",
    description: "Most commits in the college this month",
    icon_url: null,
    criteria: {
      type: "monthly_winner",
      field: "monthly_commits",
      scope: "all_users",
      minimum_competitors: 1,
      award_key_format: "YYYY-MM",
    },
  },
  {
    slug: "leaderboard-legend",
    name: "Leaderboard Legend",
    description: "Sitting at the top",
    icon_url: null,
    criteria: {
      type: "monthly_winner",
      field: "stadion_points",
      scope: "all_users",
      rank: 1,
      award_key_format: "YYYY-MM",
    },
  },
  {
    slug: "arena-king",
    name: "Arena King",
    description: "Most challenge wins this month",
    icon_url: null,
    criteria: {
      type: "monthly_winner",
      field: "challenge_wins",
      scope: "all_users",
      minimum_wins: 3,
      award_key_format: "YYYY-MM",
    },
  },
  {
    slug: "cf-king",
    name: "CF King",
    description: "Highest Codeforces rating in the college",
    icon_url: null,
    criteria: {
      type: "monthly_winner",
      field: "codeforces_rating",
      scope: "all_users",
      minimum_competitors: 2,
      award_key_format: "YYYY-MM",
    },
  },
  {
    slug: "lc-king",
    name: "LC King",
    description: "Highest LeetCode contest rating in the college",
    icon_url: null,
    criteria: {
      type: "monthly_winner",
      field: "leetcode_rating",
      scope: "all_users",
      minimum_competitors: 2,
      award_key_format: "YYYY-MM",
    },
  },
  {
    slug: "alumni-legend",
    name: "Alumni Legend",
    description: "Graduated and left a legacy",
    icon_url: null,
    criteria: {
      type: "permanent",
      condition: "is_alumni = true",
      award_key_format: "once",
    },
  },
] as const;

async function main() {
  console.log("Seeding badges...");

  for (const badge of BADGE_DEFINITIONS) {
    await db
      .insert(badges)
      .values(badge)
      .onConflictDoUpdate({
        target: badges.slug,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          icon_url: sql`excluded.icon_url`,
          criteria: sql`excluded.criteria`,
        },
      });
    console.log(`  ✓ ${badge.name} (${badge.slug})`);
  }

  console.log(`Seeded ${BADGE_DEFINITIONS.length} badges.`);
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
