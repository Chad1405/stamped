CREATE TABLE "shares" (
	"player_id" text NOT NULL,
	"date" text NOT NULL,
	"via" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shares_player_id_date_via_pk" PRIMARY KEY("player_id","date","via")
);
--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;