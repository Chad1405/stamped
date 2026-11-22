CREATE TABLE "accounts" (
	"email" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_player_id_unique" UNIQUE("player_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- passes bought before accounts existed: the buying player becomes the account, one per email and one per player
INSERT INTO "accounts" ("email", "player_id") SELECT DISTINCT ON ("player_id") "email", "player_id" FROM "purchases" WHERE "player_id" IS NOT NULL ORDER BY "player_id", "created_at" ON CONFLICT DO NOTHING;
