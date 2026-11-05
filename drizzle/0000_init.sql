CREATE TABLE "itineraries" (
	"date" text PRIMARY KEY NOT NULL,
	"flight" text NOT NULL,
	"rounds" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_members" (
	"league_id" text NOT NULL,
	"player_id" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_members_league_id_player_id_pk" PRIMARY KEY("league_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leagues_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"passes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plays" (
	"player_id" text NOT NULL,
	"date" text NOT NULL,
	"stop" integer NOT NULL,
	"state" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plays_player_id_date_stop_pk" PRIMARY KEY("player_id","date","stop")
);
--> statement-breakpoint
CREATE TABLE "results" (
	"player_id" text NOT NULL,
	"date" text NOT NULL,
	"score" integer NOT NULL,
	"tiers" jsonb NOT NULL,
	"on_time" boolean NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "results_player_id_date_pk" PRIMARY KEY("player_id","date")
);
--> statement-breakpoint
CREATE TABLE "stamps" (
	"player_id" text NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"first_date" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "stamps_player_id_kind_key_pk" PRIMARY KEY("player_id","kind","key")
);
--> statement-breakpoint
CREATE TABLE "stop_stats" (
	"date" text NOT NULL,
	"stop" integer NOT NULL,
	"players" integer DEFAULT 0 NOT NULL,
	"country" integer DEFAULT 0 NOT NULL,
	"city" integer DEFAULT 0 NOT NULL,
	"spot" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stop_stats_date_stop_pk" PRIMARY KEY("date","stop")
);
--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plays" ADD CONSTRAINT "plays_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plays" ADD CONSTRAINT "plays_date_itineraries_date_fk" FOREIGN KEY ("date") REFERENCES "public"."itineraries"("date") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_date_itineraries_date_fk" FOREIGN KEY ("date") REFERENCES "public"."itineraries"("date") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamps" ADD CONSTRAINT "stamps_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "league_members_player_idx" ON "league_members" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "results_date_idx" ON "results" USING btree ("date");