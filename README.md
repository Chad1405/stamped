# Stamped

A daily travel game. Five photo clues a day: name the country, then risk it for the city and the exact spot.
This is the live web app built from the Stamped prototype: same design and rules, with the answers, the clock and the scoring moved to the server.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No database to install: without `DATABASE_URL`, an embedded Postgres (PGlite) keeps data in `.data/pglite`. On first request it loads the four sample flights (today and the three days before), so there is always something to play.

```bash
npm test          # rules, engine, streaks, and the service against an in-memory Postgres
npm run test:e2e  # plays a whole day and a league through the real pages (needs a running server, Chrome and puppeteer-core)
npm run build     # production build
```

To start from a clean slate locally, stop the server and delete `.data/pglite`.

## How it fits together

| Layer | Where | What it does |
|---|---|---|
| Rules | `src/lib/game/` | Pure TypeScript: tiers, name matching and typo correction, the stop engine, streaks and the lounge pass. Shared by server and client, unit-tested. |
| Data | `src/db/` | Drizzle ORM over Postgres. `schema.ts` is the source of truth; `npm run db:generate` writes SQL migrations to `drizzle/`, which run automatically on startup. |
| Service | `src/server/service.ts` | Everything the API does, as plain functions: load a day without answers, apply a move inside a row-locked transaction, stamp the passport, count crowd stats, streaks, the archive, leagues. |
| API | `src/app/api/` | Thin routes: `GET /api/day`, `POST /api/play`, `GET`/`PATCH /api/me`, `GET`/`POST /api/leagues`, `DELETE /api/leagues/:id`. |
| Screens | `src/components/` | React port of the prototype. Every move goes to the server; the browser never holds an answer before its stop is finished. |

**Players are anonymous.** An unguessable id lives in an httpOnly cookie (`stamped_pid`). Sign-in can attach to the same row later, so nobody loses progress.

**What the server guarantees:**
- answers, accepted spellings and facts are sent only after a stop is finished
- each guess has a server deadline; a late guess counts as a timeout
- stops are played in order, and a finished stop cannot be replayed
- streaks and leagues count only flights finished on their own date

## Deploy (Vercel + Neon)

1. Create a Postgres database on [Neon](https://neon.tech) (or Supabase). Copy its **pooled** connection string.
2. Push this repo to GitHub and import it in [Vercel](https://vercel.com).
3. Set environment variables in Vercel:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the pooled Postgres connection string |
| `GAME_TIMEZONE` | the time zone the daily flight changes over in, e.g. `Africa/Johannesburg` (default `UTC`) |
| `SEED_SAMPLE` | `true` to load the four sample flights into an empty database; `false` once real content is loaded |

Migrations run on the first request after each deploy.

## Not built yet (in order)

1. **An editor tool for itineraries.** The sample has four days. Each new day needs a row in `itineraries` (date, flight number, five rounds: photo, answers, accepted spellings, city list, fact, credit). Until the tool exists, add rows with SQL or a seed script, or the next day shows "No flight on that date".
2. **Photo hosting.** Clue photos are in `public/clues/`. Move them to object storage with a CDN (Vercel Blob, Cloudflare R2 or Supabase Storage) once content is added daily. Every photo needs a licence that allows commercial use with credit.
3. **Sign-in** (Google or email magic link) to play across devices, attached to the anonymous player row.
4. **Rate limiting** on `/api/play` and `/api/leagues` (Upstash Redis), and analytics (PostHog) to measure day-1, day-7 and day-30 retention.
5. **Daily reminders**: opt-in email (Resend) or web push.
6. **Payments** (Stripe) for the archive, deliberately left out of this phase.
7. **Legal:** privacy policy, cookie consent if ads or analytics set cookies, terms. Check the "Stamped" name for trademark conflicts before launch.

Crowd percentages show the editor's estimate until 20 players have finished a stop, then switch to live figures.
