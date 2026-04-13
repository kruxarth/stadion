CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"criteria" jsonb NOT NULL,
	CONSTRAINT "badges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenger_id" uuid NOT NULL,
	"opponent_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"contest_id" text NOT NULL,
	"contest_name" text NOT NULL,
	"contest_start" timestamp with time zone NOT NULL,
	"contest_end" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"challenger_rank" integer,
	"opponent_rank" integer,
	"winner_id" uuid,
	"points_wagered" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_check" CHECK ("challenges"."platform" IN ('leetcode', 'codeforces')),
	CONSTRAINT "status_check" CHECK ("challenges"."status" IN ('pending', 'accepted', 'declined', 'completed', 'expired'))
);
--> statement-breakpoint
CREATE TABLE "codeforces_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer,
	"max_rating" integer,
	"rank" text,
	"contests_participated" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "codeforces_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "github_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"weekly_commits" integer DEFAULT 0 NOT NULL,
	"monthly_commits" integer DEFAULT 0 NOT NULL,
	"top_languages" jsonb,
	"contribution_data" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "github_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "leetcode_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer,
	"problems_solved" integer DEFAULT 0 NOT NULL,
	"easy_count" integer DEFAULT 0 NOT NULL,
	"medium_count" integer DEFAULT 0 NOT NULL,
	"hard_count" integer DEFAULT 0 NOT NULL,
	"contests_participated" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leetcode_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "rank_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"stadion_points" integer NOT NULL,
	"snapshot_date" date NOT NULL,
	CONSTRAINT "rank_snapshot_user_date_unique" UNIQUE("user_id","snapshot_date")
);
--> statement-breakpoint
CREATE TABLE "stadion_points_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" text NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"related_challenge_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_check" CHECK ("stadion_points_log"."source" IN ('challenge', 'manual_adjustment'))
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"award_key" text NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_badge_award_unique" UNIQUE("user_id","badge_id","award_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"username" text NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"github_username" text NOT NULL,
	"leetcode_username" text,
	"codeforces_handle" text,
	"department" text,
	"college_year" integer,
	"graduation_year" integer,
	"is_alumni" boolean DEFAULT false NOT NULL,
	"stadion_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_github_username_unique" UNIQUE("github_username"),
	CONSTRAINT "college_year_range" CHECK ("users"."college_year" IS NULL OR ("users"."college_year" >= 1 AND "users"."college_year" <= 4))
);
--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challenger_id_users_id_fk" FOREIGN KEY ("challenger_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_opponent_id_users_id_fk" FOREIGN KEY ("opponent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codeforces_stats" ADD CONSTRAINT "codeforces_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_stats" ADD CONSTRAINT "github_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leetcode_stats" ADD CONSTRAINT "leetcode_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_snapshots" ADD CONSTRAINT "rank_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stadion_points_log" ADD CONSTRAINT "stadion_points_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stadion_points_log" ADD CONSTRAINT "stadion_points_log_related_challenge_id_challenges_id_fk" FOREIGN KEY ("related_challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;