ALTER TABLE "restore_tokens" ADD COLUMN "player_id" text;--> statement-breakpoint
ALTER TABLE "restore_tokens" ADD COLUMN "code_hash" text;--> statement-breakpoint
ALTER TABLE "restore_tokens" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "restore_tokens" ADD CONSTRAINT "restore_tokens_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- emailed sign-in links from before codes: they can no longer be used, so clear them
DELETE FROM "restore_tokens" WHERE "code_hash" IS NULL;
