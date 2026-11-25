CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"message" text NOT NULL,
	"email" text,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;