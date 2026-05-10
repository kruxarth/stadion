import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerk_id: text("clerk_id").unique().notNull(),
    username: text("username").unique().notNull(),
    full_name: text("full_name").notNull(),
    avatar_url: text("avatar_url"),
    github_username: text("github_username").unique().notNull(),
    leetcode_username: text("leetcode_username"),
    codeforces_handle: text("codeforces_handle"),
    // 'btech' | 'mtech' | 'mca'
    program: text("program").default("btech").notNull(),
    department: text("department"),
    // null until onboarding is completed
    college_year: integer("college_year"),
    graduation_year: integer("graduation_year"),
    is_alumni: boolean("is_alumni").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "college_year_range",
      sql`${table.college_year} IS NULL OR (${table.college_year} >= 1 AND ${table.college_year} <= 4)`,
    ),
    check(
      "program_check",
      sql`${table.program} IN ('btech', 'mtech', 'mca')`,
    ),
  ],
);

// ─── github_stats ─────────────────────────────────────────────────────────────

export const githubStats = pgTable("github_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  // One row per user
  user_id: uuid("user_id")
    .references(() => users.id)
    .unique()
    .notNull(),
  // GitHub contributions in the last 7 days. Legacy column name.
  weekly_commits: integer("weekly_commits").default(0).notNull(),
  // GitHub contributions in the current calendar month (UTC). Legacy column name.
  monthly_commits: integer("monthly_commits").default(0).notNull(),
  // e.g. [{"name": "TypeScript", "percentage": 45}, ...]
  top_languages: jsonb("top_languages"),
  // Last 365 days as [{date: "2026-01-15", count: 3}, ...]
  contribution_data: jsonb("contribution_data"),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── leetcode_stats ───────────────────────────────────────────────────────────

export const leetcodeStats = pgTable("leetcode_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .unique()
    .notNull(),
  // Contest rating — null if user hasn't done contests
  rating: integer("rating"),
  problems_solved: integer("problems_solved").default(0).notNull(),
  easy_count: integer("easy_count").default(0).notNull(),
  medium_count: integer("medium_count").default(0).notNull(),
  hard_count: integer("hard_count").default(0).notNull(),
  contests_participated: integer("contests_participated").default(0).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── codeforces_stats ─────────────────────────────────────────────────────────

export const codeforcesStats = pgTable("codeforces_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .unique()
    .notNull(),
  // null if unrated
  rating: integer("rating"),
  max_rating: integer("max_rating"),
  // e.g. "specialist", "expert"
  rank: text("rank"),
  contests_participated: integer("contests_participated").default(0).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── badges ───────────────────────────────────────────────────────────────────

export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  // e.g. "century-club"
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  // null initially — use emoji fallback in UI
  icon_url: text("icon_url"),
  // Machine-readable criteria for documentation (not for dynamic evaluation)
  criteria: jsonb("criteria").notNull(),
});

// ─── user_badges ──────────────────────────────────────────────────────────────

export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    badge_id: uuid("badge_id")
      .references(() => badges.id)
      .notNull(),
    // "once" for permanent badges; "YYYY-MM" for monthly badges
    award_key: text("award_key").notNull(),
    awarded_at: timestamp("awarded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Prevents duplicate awards per user per badge per period
    unique("user_badge_award_unique").on(
      table.user_id,
      table.badge_id,
      table.award_key,
    ),
  ],
);

// ─── challenges ───────────────────────────────────────────────────────────────

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challenger_id: uuid("challenger_id")
      .references(() => users.id)
      .notNull(),
    opponent_id: uuid("opponent_id")
      .references(() => users.id)
      .notNull(),
    // 'leetcode' | 'codeforces'
    platform: text("platform").notNull(),
    // Platform's own contest identifier
    contest_id: text("contest_id").notNull(),
    contest_name: text("contest_name").notNull(),
    contest_start: timestamp("contest_start", { withTimezone: true }).notNull(),
    contest_end: timestamp("contest_end", { withTimezone: true }).notNull(),
    // 'pending' | 'accepted' | 'declined' | 'completed' | 'expired'
    status: text("status").default("pending").notNull(),
    // Filled after contest ends — lower = better
    challenger_rank: integer("challenger_rank"),
    opponent_rank: integer("opponent_rank"),
    winner_id: uuid("winner_id").references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "platform_check",
      sql`${table.platform} IN ('leetcode', 'codeforces')`,
    ),
    check(
      "status_check",
      sql`${table.status} IN ('pending', 'accepted', 'declined', 'completed', 'expired')`,
    ),
  ],
);

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type GithubStats = typeof githubStats.$inferSelect;
export type NewGithubStats = typeof githubStats.$inferInsert;

export type LeetcodeStats = typeof leetcodeStats.$inferSelect;
export type NewLeetcodeStats = typeof leetcodeStats.$inferInsert;

export type CodeforcesStats = typeof codeforcesStats.$inferSelect;
export type NewCodeforcesStats = typeof codeforcesStats.$inferInsert;

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;

export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;

export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
