CREATE TABLE "score_counts" (
	"date" text NOT NULL,
	"score" integer NOT NULL,
	"n" integer NOT NULL,
	CONSTRAINT "score_counts_date_score_pk" PRIMARY KEY("date","score")
);
--> statement-breakpoint
-- kept by the database itself, so every way a result arrives or leaves (a finished flight, a forgotten player) is counted
CREATE FUNCTION "score_counts_keep"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "score_counts" ("date", "score", "n") VALUES (NEW."date", NEW."score", 1)
      ON CONFLICT ("date", "score") DO UPDATE SET "n" = "score_counts"."n" + 1;
  ELSE
    UPDATE "score_counts" SET "n" = "n" - 1 WHERE "date" = OLD."date" AND "score" = OLD."score";
  END IF;
  RETURN NULL;
END $$;--> statement-breakpoint
-- the trigger goes on first: it locks results against writes until this migration commits, so the backfill below misses nothing and counts nothing twice
CREATE TRIGGER "results_score_counts" AFTER INSERT OR DELETE ON "results" FOR EACH ROW EXECUTE FUNCTION "score_counts_keep"();--> statement-breakpoint
INSERT INTO "score_counts" ("date", "score", "n") SELECT "date", "score", count(*)::int FROM "results" GROUP BY 1, 2;
