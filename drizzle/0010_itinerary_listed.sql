ALTER TABLE "itineraries" ADD COLUMN "listed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
-- Before launch, the calendar ran on sample flights (their photos are under /clues/) and replayed some of them when approved
-- stops ran out. Once a database has real flights (photos on blob storage), the samples come out of the archive.
-- A database with only samples (local development) keeps them all.
UPDATE "itineraries" SET "listed" = false
WHERE jsonb_path_exists("rounds", '$[*].img ? (@ starts with "/clues/")')
  AND EXISTS (SELECT 1 FROM "itineraries" r WHERE jsonb_path_exists(r."rounds", '$[*].img ? (@ starts with "https://")'));--> statement-breakpoint
-- Number the flights that stay 001, 002, ... by date, so the archive has no gaps.
UPDATE "itineraries" i SET "flight" = n."flight"
FROM (SELECT "date", lpad((row_number() OVER (ORDER BY "date"))::text, 3, '0') AS "flight" FROM "itineraries" WHERE "listed") n
WHERE i."date" = n."date";
