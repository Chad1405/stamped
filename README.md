# Stamped

A daily travel game. Five photo clues a day: name the country, then risk it for the city and a final question.
This is the live web app built from the Stamped prototype: same design and rules, with the answers, the clock and the scoring moved to the server.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No database to install: without `DATABASE_URL`, an embedded Postgres (PGlite) keeps data in `.data/pglite`. On first request it loads the four sample flights (today and the three days before), so there is always something to play.

```bash
npm test          # rules, engine, streaks, and the service against an in-memory Postgres
npm run test:e2e  # plays a whole day and a league through the real pages, then a whole day by touch at phone size (needs a running server, Chrome and puppeteer-core)
npm run test:sound  # renders every sound effect offline in Chrome: audible, no clipping, silent start and end, crisp attack, double-pulse tick
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

1. The Neon project is linked in `.neon` and declared in `neon.ts`. With the [Neon CLI](https://neon.com/docs/cli) (`npm i -g neon`), `neon login` then `neon deploy` provisions it and writes `DATABASE_URL` and `DATABASE_URL_UNPOOLED` to `.env.local`, so `npm run dev` / `next start` use Neon. Delete those lines to go back to the embedded PGlite.
2. Push this repo to GitHub and import it in [Vercel](https://vercel.com) (Fluid compute, the default, reuses the `pg` pool across requests).
3. Set environment variables in Vercel:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon's **pooled** connection string (host ends in `-pooler`), used for app queries |
| `DATABASE_URL_UNPOOLED` | Neon's direct connection string, used only to run migrations (falls back to `DATABASE_URL` if unset) |
| `GAME_TIMEZONE` | the time zone the daily flight changes over in, e.g. `Africa/Johannesburg` (default `UTC`) |
| `SEED_SAMPLE` | leave unset to fill the calendar by rotating the sample flights; `false` once real content is loaded |
| `RESEND_API_KEY`, `ALERT_EMAIL` | where the low-calendar warning goes ([Resend](https://resend.com)). Without them it only appears in the logs. `ALERT_EMAIL_FROM` sets the sender (default: Resend's test address, which only delivers to your own Resend account's email) |

| `ANTHROPIC_API_KEY` | lets the weekly job draft stops with Claude (Opus 5.5). Without it, the job and the "Draft stops now" button report that it isn't set |
| `ADMIN_PASSWORD` | opens `/admin`, the approval page (any username; use something long, there's no attempt limit). Without it, nobody gets in |
| `BLOB_STORE_ID` (or `BLOB_READ_WRITE_TOKEN` on older stores) | Vercel Blob, where approved photos live. Added for you when you connect a Blob store to the project. Without it, local dev saves photos to `public/clues/bank` and production refuses the batch |

Migrations run on the first request after each deploy.

**Drafting.** Every Monday at 05:00 UTC a second Schedule (`draft-stops`) tops up the review queue: for each stop type short of three weeks waiting, Claude suggests places, then writes each stop from its English Wikipedia article and picks one of four free-to-use Commons photos (no readable signs or captions). Drafts go through the same checks as a pasted batch, land as pending in `/admin`, and an email says how many are waiting. Nothing reaches players until you approve it. `/admin` can also run it on demand.

**The calendar.** A daily Vercel Schedule (`keep-calendar` in `vercel.json`) keeps flights ready 14 days ahead and warns when fewer than 7 are. It builds them from approved stops in the bank, one of each type, easy to hard, with no country back within 7 days, replacing any coming day that still holds a sample. Empty days take a sample while `SEED_SAMPLE` isn't `false`. If today or tomorrow still has no flight, it replays the flight that has gone longest without being shown. The first request of each day does the same top-up, in case the job didn't run. Players can't reach a future date.

**Adding stops.** Paste a JSON list into `/admin`. Each item is a stop as in `src/content/itineraries.json`, without `img` and `credit`, plus `photo` (a Wikimedia Commons file page; not needed for Language stops), and optionally `note` (shown to the reviewer) and `source` (a link for the fact). The licence and credit come from Commons; photos are resized, stripped of metadata and saved under a random name. Stops that fail the checks in `src/server/bank.ts` are skipped with the reason.

## Not built yet (in order)

1. **Automatic drafting.** A scheduled job that finds places and writes drafts into the bank. Until then, batches are pasted into `/admin`.
2. **Moving the sample photos.** The sample clues are still in `public/clues/`; they can go once real flights replace them.
3. **Sign-in** (Google or email magic link) to play across devices, attached to the anonymous player row.
4. **Rate limiting** on `/api/play` and `/api/leagues` (Upstash Redis), and analytics (PostHog) to measure day-1, day-7 and day-30 retention.
5. **Daily reminders**: opt-in email (Resend) or web push.
6. **Payments** (Stripe) for the archive, deliberately left out of this phase.
7. **Legal:** privacy policy, cookie consent if ads or analytics set cookies, terms. Check the "Stamped" name for trademark conflicts before launch.

Crowd percentages show the editor's estimate until 20 players have finished a stop, then switch to live figures.
