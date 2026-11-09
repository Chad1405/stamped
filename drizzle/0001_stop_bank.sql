CREATE TABLE "stop_bank" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"round" jsonb NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"used_on" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stop_bank" ADD CONSTRAINT "stop_bank_used_on_itineraries_date_fk" FOREIGN KEY ("used_on") REFERENCES "public"."itineraries"("date") ON DELETE no action ON UPDATE no action;