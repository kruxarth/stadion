DROP TABLE "rank_snapshots" CASCADE;--> statement-breakpoint
DROP TABLE "stadion_points_log" CASCADE;--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN "points_wagered";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "stadion_points";--> statement-breakpoint
DELETE FROM "user_badges" WHERE "badge_id" IN (
	SELECT "id" FROM "badges" WHERE "slug" = 'leaderboard-legend'
);--> statement-breakpoint
DELETE FROM "badges" WHERE "slug" = 'leaderboard-legend';--> statement-breakpoint
INSERT INTO "badges" ("slug", "name", "description", "icon_url", "criteria")
VALUES (
	'duelist',
	'Duelist',
	'Won a ranked head-to-head challenge',
	NULL,
	'{"type":"permanent","field":"challenge_wins","scope":"all_users","minimum_wins":1,"award_key_format":"once"}'::jsonb
)
ON CONFLICT ("slug") DO UPDATE SET
	"name" = EXCLUDED."name",
	"description" = EXCLUDED."description",
	"icon_url" = EXCLUDED."icon_url",
	"criteria" = EXCLUDED."criteria";
