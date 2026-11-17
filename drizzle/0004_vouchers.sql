ALTER TABLE "players" ADD COLUMN "voucher_dates" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "voucher_flights" jsonb DEFAULT '[]'::jsonb NOT NULL;