// Everything the API does, as plain functions over a Db, so tests can drive them without HTTP.
import { createHash, timingSafeEqual } from "node:crypto";
import { and, asc, desc, eq, gt, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { accounts, feedback, itineraries, leagueMembers, leagues, players, plays, purchases, restoreTokens, results, scoreCounts, shares, stamps, stopBank, stopStats } from "@/db/schema";
import { applyAction, countryClues, freshStop, stopPoints, type Action, type Event, type Round, type StopState } from "@/lib/game/engine";
import { countryByName } from "@/lib/game/match";
import { CONT, CONT3, NAMED_CITY, NAMED_COUNTRY, ROUNDS_PER_DAY, STOP_TYPES, VOUCHER_AT, type TierId, kmBetween } from "@/lib/game/rules";
import { addDays, streakInfo, weekOf } from "@/lib/game/streak";
import { THEMES } from "@/lib/client/theme";
import citiesData from "@/content/cities.json";
import iso3Data from "@/content/iso3.json";
import capitalsData from "@/content/capitals.json";
import seedDays from "@/content/itineraries.json";

const CITIES = citiesData as Record<string, string[]>, ISO3 = iso3Data as Record<string, string>;
const CAPITALS = capitalsData as unknown as Record<string, [string, number, number]>;   // a guessed country is measured from its capital
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }

/** The game's calendar day. Everyone plays the same itinerary on the same date in GAME_TIMEZONE. */
export const gameToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: process.env.GAME_TIMEZONE || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

export const newId = (n = 16) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, "0")).join("");

/* ---- players ---- */
export async function ensurePlayer(db: Db, id: string | undefined): Promise<string> {
  if (id && /^[a-f0-9]{32}$/.test(id)) {
    const [p] = await db.select({ id: players.id }).from(players).where(eq(players.id, id));
    if (p) return p.id;
  }
  const fresh = newId();
  await db.insert(players).values({ id: fresh });
  return fresh;
}
/** Deletes a player and everything kept about them: plays, results, stamps, league places and the leagues they started. Anonymous totals per stop stay. */
export async function forgetPlayer(db: Db, playerId: string) {
  await db.delete(players).where(eq(players.id, playerId));
}
export const cleanName = (s: unknown) => String(s ?? "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
/** Where a new player came from: a link's ?src= label (like "tiktok") or the site that sent them (like "reddit.com").
 *  The first source wins, and only within a player's first hour, so a later visit from somewhere else doesn't rewrite it. */
export async function setSource(db: Db, playerId: string, source: unknown) {
  const s = String(source ?? "").trim().toLowerCase().split(/[/?#\s]/)[0].replace(/^www\./, "").replace(/[^a-z0-9._-]/g, "").slice(0, 40);
  if (!s) return;
  await db.update(players).set({ source: s })
    .where(and(eq(players.id, playerId), isNull(players.source), gt(players.createdAt, sql`now() - interval '1 hour'`)));
}
/** The look this player's browser is showing, so the admin page can count how many use each. Only known theme ids are kept; classic is stored as null. */
export async function setLook(db: Db, playerId: string, look: unknown) {
  if (!THEMES.some(t => t.id === look)) return;
  await db.update(players).set({ look: look === "classic" ? null : (look as string) }).where(eq(players.id, playerId));
}
export async function setName(db: Db, playerId: string, name: unknown) {
  await db.update(players).set({ name: cleanName(name) }).where(eq(players.id, playerId));
}

/* ---- content ---- */
/** How many days ahead the calendar is kept, and how few trigger a warning. */
export const DAYS_AHEAD = 14, LOW_DAYS = 7;
/** A country doesn't come back within this many days. */
const COUNTRY_GAP = 7;
/** Sample content until an editor tool exists: the sample days rotate, so today and the three days before it always have a flight.
 *  The first seed puts the newest sample on today; each later date takes the next sample in turn and the next flight number. */
export const SAMPLES = (seedDays as { offset: number; rounds: Round[] }[]).toSorted((a, b) => a.offset - b.offset);
const keyOf = (r: Round) => r.img ?? r.postcard?.text ?? r.prompt;   // a stop's photo or message identifies it; prompts repeat between stops
const sampleFor = (rounds: Round[]) => { const mine = rounds.map(keyOf); return SAMPLES.find(x => x.rounds.length === rounds.length && x.rounds.every(r => mine.includes(keyOf(r)))); };
export const isSampleFlight = (rounds: Round[]) => sampleFor(rounds) !== undefined;
const daysBetween =(a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
export async function seedSamples(db: Db, today: string) {
  const [{ first }] = await db.select({ first: sql<string | null>`min(${itineraries.date})` }).from(itineraries);
  const anchor = first ?? addDays(today, -(SAMPLES.length - 1));
  const rows = Array.from({ length: SAMPLES.length + DAYS_AHEAD }, (_, k) => addDays(today, DAYS_AHEAD - k)).filter(d => d >= anchor).map(date => {
    const n = daysBetween(anchor, date);
    return { date, flight: String(n + 1).padStart(3, "0"), rounds: SAMPLES[n % SAMPLES.length].rounds };
  });
  await db.insert(itineraries).values(rows).onConflictDoNothing({ target: itineraries.date });   // never replaces a flight that already exists
  // flights copied from a sample follow later edits to the sample file; a real flight never shares a sample's photos, so it is never touched
  // ponytail: reads every flight once a day per server; drop this when real itineraries replace the samples
  for (const row of await db.select({ date: itineraries.date, rounds: itineraries.rounds }).from(itineraries)) {
    const rounds = row.rounds as Round[], mine = rounds.map(keyOf), same = sampleFor(rounds);
    if (!same || JSON.stringify(same.rounds) === JSON.stringify(rounds)) continue;
    // progress is saved by stop number, so a flight is only reordered before anyone has played it; a played one keeps its order and takes the new wording
    const reordered = same.rounds.some((r, i) => keyOf(r) !== mine[i]);
    const keepOrder = reordered && (await db.select({ n: plays.stop }).from(plays).where(eq(plays.date, row.date)).limit(1)).length > 0;
    await db.update(itineraries).set({ rounds: keepOrder ? mine.map(k => same.rounds.find(r => keyOf(r) === k)!) : same.rounds }).where(eq(itineraries.date, row.date));
  }
}
/** Builds flights from approved stops, for any coming day that is empty or still holds a sample. Today is left alone: people may be playing it. */
export async function fillFromBank(db: Db, today: string) {
  return db.transaction(async tx => {
    const ready = await tx.select().from(stopBank).where(and(eq(stopBank.status, "approved"), isNull(stopBank.usedOn))).orderBy(asc(stopBank.createdAt)).for("update");   // two servers filling at once must not use a stop twice
    const rows = await tx.select().from(itineraries);
    const byDate = new Map(rows.map(r => [r.date, r.rounds as Round[]]));
    let made = 0;
    for (let k = 1; k <= DAYS_AHEAD; k++) {
      const date = addDays(today, k), existing = byDate.get(date);
      if (existing && !isSampleFlight(existing)) continue;
      const taken = new Set<string>();
      for (let back = 1; back <= COUNTRY_GAP; back++) {   // samples don't count, or they'd hold up the first real flights
        const earlier = byDate.get(addDays(date, -back)) ?? [];
        if (!isSampleFlight(earlier)) for (const r of earlier) taken.add(r.country);
      }
      const picks: typeof ready = [];
      for (const type of STOP_TYPES) {
        const pick = ready.find(s => !s.usedOn && s.round.type === type && !taken.has(s.round.country));
        if (!pick) break;
        picks.push(pick); pick.usedOn = date; taken.add(pick.round.country);
      }
      if (picks.length < STOP_TYPES.length) { for (const p of picks) p.usedOn = null; break; }   // later days can't be fuller than this one
      const flightRounds = picks.map(p => p.round).toSorted((a, b) => b.crowd[0] - a.crowd[0]);   // easy to hard
      const flight = nextFlightNo(rows, date);
      await tx.insert(itineraries).values({ date, flight, rounds: flightRounds }).onConflictDoUpdate({ target: itineraries.date, set: { rounds: flightRounds, flight, listed: true } });
      await tx.update(stopBank).set({ usedOn: date }).where(inArray(stopBank.id, picks.map(p => p.id)));
      byDate.set(date, flightRounds);
      rows.splice(0, rows.length, ...rows.filter(r => r.date !== date), { date, flight, rounds: flightRounds, listed: true });
      made++;
    }
    return made;
  });
}
/** A new listed flight's number: one more than the last listed flight before it, so the archive counts 001, 002, ... with no gaps. */
const nextFlightNo = (rows: { date: string; flight: string; listed: boolean }[], date: string) =>
  String(Math.max(0, ...rows.filter(r => r.listed && r.date < date).map(r => Number(r.flight) || 0)) + 1).padStart(3, "0");
/** The last resort for a date with no flight: replay the one that has gone longest without being shown, so a day is never missing or unvetted.
 *  A replay keeps the original's number and stays out of the archive, so nobody who buys the pass finds the same flight twice. */
async function replayIfMissing(db: Db, date: string) {
  if ((await db.select({ date: itineraries.date }).from(itineraries).where(eq(itineraries.date, date))).length) return false;
  const [old] = await db.select({ rounds: itineraries.rounds, flight: sql<string>`min(${itineraries.flight}) filter (where ${itineraries.listed})` })
    .from(itineraries).groupBy(itineraries.rounds).orderBy(sql`max(${itineraries.date})`).limit(1);
  if (!old) return false;
  const flight = old.flight ?? nextFlightNo(await db.select().from(itineraries), date);   // a flight that was never listed has no number of its own
  return (await db.insert(itineraries).values({ date, flight, rounds: old.rounds, listed: false }).onConflictDoNothing({ target: itineraries.date }).returning()).length > 0;   // two servers can race at midnight; one wins
}
/** Fills the calendar and makes sure today and tomorrow exist. Returns how many days in a row are ready after today, and any dates that had to replay. */
export async function keepCalendar(db: Db, today: string, seed = process.env.SEED_SAMPLE !== "false") {
  await fillFromBank(db, today);
  if (seed) await seedSamples(db, today);
  const replayed: string[] = [];
  for (const date of [today, addDays(today, 1)]) if (await replayIfMissing(db, date)) replayed.push(date);
  const ready = new Set((await db.select({ date: itineraries.date }).from(itineraries).where(gt(itineraries.date, today))).map(r => r.date));
  let ahead = 0;
  while (ready.has(addDays(today, ahead + 1))) ahead++;
  return { ahead, replayed };
}
/** The daily job: top up the calendar and say so when it is running low. */
export async function dailyCalendarCheck(db: Db, today: string, warn: (subject: string, text: string) => Promise<void>, seed?: boolean) {
  const { ahead, replayed } = await keepCalendar(db, today, seed);
  if (ahead < LOW_DAYS) await warn(`Born There: only ${ahead} ${ahead === 1 ? "day" : "days"} of flights ready`,
    `Flights are ready for the next ${ahead} ${ahead === 1 ? "day" : "days"} after ${today}. Add more to keep ${DAYS_AHEAD} days ahead.${replayed.length ? ` Replaying an old flight on: ${replayed.join(", ")}.` : ""}`);
  return { ahead, replayed };
}
async function itinerary(db: Db, date: string, today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) throw new HttpError(404, "No flight on that date.");
  const [it] = await db.select().from(itineraries).where(eq(itineraries.date, date));
  if (!it || (!it.listed && date !== today)) throw new HttpError(404, "No flight on that date.");   // a replay is only playable on its own day
  return it;
}

/* ---- what the browser may see ---- */
/** The city suggestions: the country's known cities plus the answer. A country without a real list gets none, and the player types
 *  freely, since a list of one (or a handful) would hand over the answer. */
const MIN_CITY_CHOICES = 8;
const citiesFor = (r: Round) => {
  const known = CITIES[r.country] ?? [];
  return known.length < MIN_CITY_CHOICES ? [] : [...new Set([...known, r.cityName])].sort((a, b) => a.localeCompare(b));
};
/** Before a stop is finished: the clue and nothing that names the answer. The city list and the final question narrow down the country, so they wait until it is banked or the stop is over. */
const publicRound = (r: Round, i: number, s: StopState) => {
  const known = s.banked !== null || s.phase === "done";
  return { stop: i, type: r.type, prompt: r.prompt, img: r.img ?? null, alt: r.alt ?? null, postcard: r.postcard ?? null,
    spotLabel: known ? r.spotLabel : null, spotWord: known ? r.spotWord : null, cities: known ? citiesFor(r) : [] };
};
export const codeFor = (r: Round, tier: TierId) => {
  if (tier === "native" || tier === "local") return r.airport;
  if (tier === "miss") return "—";   // nothing named, so no code to show (a dash, not "???", which reads as missing data)
  if (tier === "tourist") return CONT3[countryByName(r.country)!.cont[0]];
  return ISO3[r.country] ?? r.country.slice(0, 3).toUpperCase();
};
export const placeFor = (r: Round, tier: TierId) =>
  tier === "native" || tier === "local" ? r.cityName : tier === "traveller" ? r.regionName : tier === "backpacker" || tier === "lost" ? r.country
    : tier === "tourist" ? CONT[countryByName(r.country)!.cont[0]] : "No entry";
const MIN_LIVE_PLAYERS = 20;   // below this, show the editor's estimate instead of a noisy percentage
function reveal(r: Round, tier: TierId, stats?: typeof stopStats.$inferSelect, prev?: Round, guesses: string[] = []) {
  const km = prev ? kmBetween(prev, r) : null;
  const last = guesses.at(-1);   // a missed stop's guesses are all countries; the last try is the one to measure
  const guess = (tier === "tourist" || tier === "miss") && last && last !== r.country ? last : undefined, cap = guess ? CAPITALS[guess] : undefined;
  const offKm = cap ? kmBetween({ lat: cap[1], lng: cap[2] }, r) : null;
  const live = stats && stats.players >= MIN_LIVE_PLAYERS;
  const pct = (n: number) => Math.round(100 * n / stats!.players);
  return {
    country: r.country, regionName: r.regionName, cityName: r.cityName, spotName: r.spotName, airport: r.airport, fact: r.fact, tells: r.tells ?? null, credit: r.credit ?? null,
    at: r.lat !== undefined && r.lng !== undefined ? { lat: r.lat, lng: r.lng } : null,   // the city, for the map on the back of the card (the stop is over)
    code: codeFor(r, tier), place: placeFor(r, tier),
    leg: km === null ? null : { from: prev!.cityName, km },   // the flight in from the previous stop
    off: offKm === null ? null : { guess: guess!, capital: cap![0], km: offKm },   // a wrong country: how far off it was (shown, not scored)
    crowd: live ? { source: "live" as const, players: stats!.players, values: [pct(stats!.country), pct(stats!.city), pct(stats!.spot)] }
                : { source: "estimate" as const, players: stats?.players ?? 0, values: r.crowd },
  };
}
const stopView = (r: Round, s: StopState) => ({ phase: s.phase, step: s.step, banked: s.banked, next: s.next, guesses: s.guesses, misses: s.misses ?? 0,
  endsAt: s.endsAt, tier: s.tier, note: s.note, points: stopPoints(s), clues: countryClues(r, s) });

/* ---- a day ---- */
/** How a finished day compares with everyone else who finished the same flight; null until enough others have. */
export async function fieldFor(db: Db, playerId: string, date: string) {
  const [mine] = await db.select({ score: results.score }).from(results).where(and(eq(results.playerId, playerId), eq(results.date, date)));
  if (!mine) return null;
  // one row per distinct score, not per player: this runs on every finish, so it must not grow with the crowd
  const [n] = await db.select({ all: sql<number>`coalesce(sum(${scoreCounts.n}), 0)::int`, below: sql<number>`coalesce(sum(${scoreCounts.n}) filter (where ${scoreCounts.score} < ${mine.score}), 0)::int` })
    .from(scoreCounts).where(eq(scoreCounts.date, date));
  const others = n.all - 1;   // the count includes this player, at their own score, so never among those below
  return others >= MIN_LIVE_PLAYERS ? { players: others + 1, better: Math.round(100 * n.below / others) } : null;
}

export async function getDay(db: Db, playerId: string, date: string, today: string) {
  const it = await itinerary(db, date, today);
  if (!await canOpen(db, playerId, date, today)) throw new HttpError(402, "Older flights are part of the archive pass.");
  const [rows, stats] = await Promise.all([
    db.select().from(plays).where(and(eq(plays.playerId, playerId), eq(plays.date, date))),
    db.select().from(stopStats).where(eq(stopStats.date, date)),
  ]);
  const stops = it.rounds.map((r, i) => {
    const s = rows.find(x => x.stop === i)?.state ?? freshStop();
    return { ...publicRound(r, i, s), state: stopView(r, s), reveal: s.phase === "done" && s.tier ? reveal(r, s.tier, stats.find(x => x.stop === i), it.rounds[i - 1], s.guesses) : null };
  });
  const score = stops.reduce((n, s) => n + s.state.points, 0);
  const finished = stops.every(s => s.state.phase === "done");
  const field = finished ? await fieldFor(db, playerId, date) : null;
  return { date, flight: it.flight, isToday: date === today, serverNow: Date.now(), score, stops, field, tomorrow: finished && date === today ? await teaser(db, today) : null,
    example: date === today ? await example(db, today) : null, playersSoFar: date === today ? await playersSoFar(db) : null };
}

export const SHOW_PLAYERS_FROM = 1000;   // "22 people have played" tells a visitor nobody's here; the line appears once the number helps
const playerCounts = new WeakMap<Db, { n: number; at: number }>();
/** How many people have started a flight, for the start screen; null until there are enough to be worth saying.
 *  Counted at most every five minutes, since every visit asks. */
// ponytail: per-process cache, so each server instance may lag a few minutes; fine for a headline number
export async function playersSoFar(db: Db, now = Date.now()) {
  let c = playerCounts.get(db);
  if (!c || now - c.at > 5 * 60_000) {
    const [r] = await db.select({ n: sql<number>`count(distinct ${plays.playerId})::int` }).from(plays);
    playerCounts.set(db, c = { n: r.n, at: now });
  }
  return c.n >= SHOW_PLAYERS_FROM ? c.n : null;
}

/** Yesterday's flight with every answer, for the public answers page. Never today's: leagues and streaks count only flights
 *  played on their own day, so yesterday's answers can't lift anyone's league score. */
export async function yesterdaysAnswers(db: Db, today: string) {
  const date = addDays(today, -1);
  const [[it], stats] = await Promise.all([
    db.select().from(itineraries).where(eq(itineraries.date, date)),
    db.select().from(stopStats).where(eq(stopStats.date, date)),
  ]);
  if (!it) return null;
  return { date, flight: it.flight, stops: it.rounds.map((r, i) => {
    const st = stats.find(x => x.stop === i);
    return { round: r, gotCountry: st && st.players >= MIN_LIVE_PLAYERS ? Math.round(100 * st.country / st.players) : null };
  }) };
}

/** For the start screen: one photo stop from a flight that has already been shown (two or more days ago), so it spoils nothing.
 *  Only the photo and the question go out, never the answer. */
async function example(db: Db, today: string) {
  const past = await db.select().from(itineraries).where(and(lte(itineraries.date, addDays(today, -2)), eq(itineraries.listed, true))).orderBy(desc(itineraries.date)).limit(3);
  for (const it of past) {
    const r = it.rounds.find(x => x.type === "Landmark" && x.img) ?? it.rounds.find(x => x.img);
    if (r) return { img: r.img!, alt: r.alt ?? "", prompt: r.prompt, flight: it.flight };
  }
  return null;
}

const TEASE: Record<string, string> = { Landmark: "a landmark", Food: "a dish", "Street View": "a street", "Close-up": "a close-up", Language: "a text message" };
/** A reason to come back: what kind of place tomorrow's first stop is, and its continent. Only once today's flight is done. */
async function teaser(db: Db, today: string) {
  const [next] = await db.select().from(itineraries).where(eq(itineraries.date, addDays(today, 1)));
  const r = next?.rounds[0], cont = r && countryByName(r.country)?.cont[0];
  return r && cont ? { flight: next.flight, what: TEASE[r.type] ?? "a place", continent: CONT[cont] } : null;
}

/* ---- playing ---- */
export type ActResult = {
  stop: ReturnType<typeof publicRound> & { state: ReturnType<typeof stopView>; reveal: ReturnType<typeof reveal> | null };
  event: Event; gain: { country?: string; city?: string; rare?: string } | null; dayDone: boolean; serverNow: number;
  field?: Awaited<ReturnType<typeof fieldFor>>;   // with the last stop: how the day compares with everyone else's
};
export async function act(db: Db, playerId: string, date: string, stop: number, action: Action, today: string, now = Date.now()): Promise<ActResult> {
  const it = await itinerary(db, date, today);
  if (!await canOpen(db, playerId, date, today)) throw new HttpError(402, "Older flights are part of the archive pass.");
  if (!Number.isInteger(stop) || stop < 0 || stop >= it.rounds.length) throw new HttpError(400, "No such stop.");
  const r = it.rounds[stop];
  const { state, event, gain, dayDone } = await db.transaction(async tx => {
    const done = await tx.select({ stop: plays.stop, state: plays.state }).from(plays).where(and(eq(plays.playerId, playerId), eq(plays.date, date))).for("update");
    for (let i = 0; i < stop; i++) if (done.find(d => d.stop === i)?.state.phase !== "done") throw new HttpError(409, "Finish the earlier stops first.");
    const before = done.find(d => d.stop === stop)?.state ?? freshStop();
    const { state, event } = applyAction(r, before, action, now);
    if (state !== before) await tx.insert(plays).values({ playerId, date, stop, state }).onConflictDoUpdate({ target: [plays.playerId, plays.date, plays.stop], set: { state, updatedAt: new Date() } });
    let gain: ActResult["gain"] = null, dayDone = false;
    if (event.kind === "finished") {
      gain = await stampPassport(tx as Db, playerId, r, event.tier, date);
      const all = it.rounds.map((_, i) => i === stop ? state : done.find(d => d.stop === i)?.state);
      if (all.every(s => s?.phase === "done")) {
        dayDone = true;
        const tiers = all.map(s => s!.tier!);
        await tx.insert(results).values({ playerId, date, score: all.reduce((n, s) => n + stopPoints(s!), 0), tiers, onTime: date === today }).onConflictDoNothing();
      }
    }
    return { state, event, gain, dayDone };
  });
  // Every player finishing this stop writes the same row, so the tally runs after the transaction: one short statement,
  // not a lock held through the rest of it. The player's own row lock above already makes a finish count once.
  let stats: typeof stopStats.$inferSelect | undefined;
  if (event.kind === "finished") {
    [stats] = await db.insert(stopStats).values({ date, stop, players: 1, country: +NAMED_COUNTRY.includes(event.tier), city: +NAMED_CITY.includes(event.tier), spot: +(event.tier === "native") })
      .onConflictDoUpdate({ target: [stopStats.date, stopStats.stop], set: {
        players: sql`${stopStats.players} + 1`, country: sql`${stopStats.country} + ${+NAMED_COUNTRY.includes(event.tier)}`,
        city: sql`${stopStats.city} + ${+NAMED_CITY.includes(event.tier)}`, spot: sql`${stopStats.spot} + ${+(event.tier === "native")}` } }).returning()
      .catch(e => { console.error("[stats] tally failed", e); return []; });   // a missed count never costs the player their stop
  } else if (state.phase === "done") [stats] = await db.select().from(stopStats).where(and(eq(stopStats.date, date), eq(stopStats.stop, stop)));
  const res: ActResult = { stop: { ...publicRound(r, stop, state), state: stopView(r, state), reveal: state.phase === "done" && state.tier ? reveal(r, state.tier, stats, it.rounds[stop - 1], state.guesses) : null }, event, gain, dayDone, serverNow: now };
  return dayDone ? { ...res, field: await fieldFor(db, playerId, date) } : res;
}
async function stampPassport(db: Db, playerId: string, r: Round, tier: TierId, date: string) {
  const want: (typeof stamps.$inferInsert)[] = [];
  if (NAMED_COUNTRY.includes(tier)) want.push({ playerId, kind: "country", key: r.country, firstDate: date, meta: { code: ISO3[r.country] ?? r.country.slice(0, 3).toUpperCase(), cont: countryByName(r.country)!.cont[0] } });
  if (NAMED_CITY.includes(tier)) want.push({ playerId, kind: "city", key: `${r.cityName}, ${r.country}`, firstDate: date, meta: { airport: r.airport } });
  if (tier === "native") want.push({ playerId, kind: "rare", key: r.spotName, firstDate: date, meta: { airport: r.airport, city: r.cityName } });
  if (!want.length) return null;
  const added = await db.insert(stamps).values(want).onConflictDoNothing().returning({ kind: stamps.kind, key: stamps.key });
  const gain: { country?: string; city?: string; rare?: string } = {};
  for (const a of added) gain[a.kind] = a.kind === "city" ? a.key.split(", ")[0] : a.key;
  return added.length ? gain : null;
}

/* ---- the player's record ---- */
async function streakFor(db: Db, playerId: string, today: string, persist: boolean) {
  const [p] = await db.select({ passes: players.passes }).from(players).where(eq(players.id, playerId));
  const onTime = await db.select({ date: results.date }).from(results).where(and(eq(results.playerId, playerId), eq(results.onTime, true)));
  const info = streakInfo(new Set(onTime.map(r => r.date)), p?.passes ?? [], today);
  if (persist && info.spend) await db.update(players).set({ passes: [...(p?.passes ?? []), info.spend] }).where(eq(players.id, playerId));
  // a voucher milestone reached today: once, however often the page asks (the condition keeps two requests from both awarding it)
  if (persist && info.milestone && VOUCHER_AT.includes(info.milestone))
    await db.update(players).set({ voucherDates: sql`${players.voucherDates} || ${JSON.stringify([today])}::jsonb` }).where(and(eq(players.id, playerId), sql`not ${players.voucherDates} ? ${today}`));
  return info;
}
export async function getMe(db: Db, playerId: string, today: string) {
  const streak = await streakFor(db, playerId, today, true);   // first: it may award a voucher, which the player row below should include
  const [[p], myStamps, myResults, days, progress] = await Promise.all([
    db.select().from(players).where(eq(players.id, playerId)),
    db.select().from(stamps).where(eq(stamps.playerId, playerId)).orderBy(asc(stamps.firstDate)),
    db.select().from(results).where(eq(results.playerId, playerId)),
    db.select({ date: itineraries.date, flight: itineraries.flight }).from(itineraries)
      .where(and(lte(itineraries.date, today), or(eq(itineraries.listed, true), eq(itineraries.date, today)))).orderBy(desc(itineraries.date)),
    db.select({ date: plays.date, n: sql<number>`count(*) filter (where ${plays.state}->>'phase' = 'done')::int` }).from(plays).where(eq(plays.playerId, playerId)).groupBy(plays.date),
  ]);
  const onTime = myResults.filter(r => r.onTime);
  const [[acct], [bought]] = await Promise.all([
    db.select({ email: accounts.email }).from(accounts).where(eq(accounts.playerId, playerId)),
    db.select({ email: purchases.email }).from(purchases).where(eq(purchases.playerId, playerId)).orderBy(desc(purchases.createdAt)).limit(1),
  ]);
  return {
    id: playerId, name: p?.name ?? "", look: p?.look ?? "classic", today, streak, unlocked: p?.unlocked ?? false, email: acct?.email ?? null, passEmail: bought?.email || null,   // passEmail: what they paid with, to prefill confirming it
    vouchers: vouchersOf(p, today, streak.n),
    record: { flights: onTime.length, best: Math.max(0, ...onTime.map(r => r.score)) },
    passport: {
      countries: myStamps.filter(s => s.kind === "country").map(s => ({ name: s.key, first: s.firstDate, code: s.meta.code, cont: s.meta.cont })),
      cities: myStamps.filter(s => s.kind === "city").map(s => ({ name: s.key, first: s.firstDate, airport: s.meta.airport })),
      rare: myStamps.filter(s => s.kind === "rare").map(s => ({ spot: s.key, first: s.firstDate, airport: s.meta.airport, city: s.meta.city })),
    },
    days: days.map(d => {
      const res = myResults.find(r => r.date === d.date);
      const started = progress.find(x => x.date === d.date);
      return { date: d.date, flight: d.flight, isToday: d.date === today, score: res?.score ?? null, stopsDone: res ? ROUNDS_PER_DAY : started?.n ?? 0,
        locked: !p?.unlocked && d.date <= addDays(today, -FREE_DAYS) && !res && !started && !p?.voucherFlights.includes(d.date) };
    }),
  };
}

/* ---- boarding vouchers ---- */
/** Earned at streak milestones (VOUCHER_AT), each opens one archive flight for good. `next` is the streak that earns the next one. */
function vouchersOf(p: { voucherDates: string[]; voucherFlights: string[] } | undefined, today: string, streak: number) {
  const dates = p?.voucherDates ?? [];
  return { left: Math.max(0, dates.length - (p?.voucherFlights.length ?? 0)), earned: dates.length, earnedToday: dates.includes(today), next: VOUCHER_AT.find(m => m > streak) ?? null };
}
/** Opens one locked archive flight with a voucher. The update's own condition stops a double tap spending two. */
export async function spendVoucher(db: Db, playerId: string, date: unknown, today: string) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "Pick a flight.");
  if (await canOpen(db, playerId, date, today)) throw new HttpError(409, "That flight is already open.");
  const [it] = await db.select({ date: itineraries.date }).from(itineraries).where(and(eq(itineraries.date, date), eq(itineraries.listed, true)));
  if (!it) throw new HttpError(404, "No flight on that day.");
  const done = await db.update(players).set({ voucherFlights: sql`${players.voucherFlights} || ${JSON.stringify([date])}::jsonb` })
    .where(and(eq(players.id, playerId), sql`jsonb_array_length(${players.voucherFlights}) < jsonb_array_length(${players.voucherDates})`)).returning({ id: players.id });
  if (!done.length) throw new HttpError(402, "You don't have a boarding voucher left.");
  return getMe(db, playerId, today);
}

/* ---- the archive pass ---- */
/** Today's and yesterday's flights are free. Older ones need the pass, except a flight you'd already started, so nothing played before the pass existed gets locked away. */
export const FREE_DAYS = 2;
export async function canOpen(db: Db, playerId: string, date: string, today: string) {
  if (date > addDays(today, -FREE_DAYS)) return true;
  const [p] = await db.select({ unlocked: players.unlocked, voucherFlights: players.voucherFlights }).from(players).where(eq(players.id, playerId));
  if (p?.unlocked || p?.voucherFlights.includes(date)) return true;
  const [started] = await db.select({ date: plays.date }).from(plays).where(and(eq(plays.playerId, playerId), eq(plays.date, date))).limit(1);
  return started !== undefined;
}
/** A paid Checkout Session: kept as a sale record, and unlocks the player who bought it. The email typed at Checkout is not proof
 *  of owning it, so it only becomes a sign-in once someone confirms it with an emailed code (verifySignIn). Safe to call twice. */
export async function recordPurchase(db: Db, sale: { sessionId: string; email: string; playerId: string | null }) {
  const email = sale.email.trim().toLowerCase();
  const [p] = sale.playerId ? await db.select({ id: players.id }).from(players).where(eq(players.id, sale.playerId)) : [];
  await db.insert(purchases).values({ sessionId: sale.sessionId, email, playerId: p?.id ?? null }).onConflictDoNothing();
  if (!p) return;
  await db.update(players).set({ unlocked: true }).where(eq(players.id, p.id));
}
/** Sign-in is a 6-digit code emailed to a pass holder and typed into the browser that asked for it. Typing it proves both that
 *  the person reads that mailbox and that this browser is theirs, so nobody can sign a browser in from a link or a guess. */
const CODE_MINUTES = 15, CODE_TRIES = 5;
const hashCode = (email: string, code: string) => createHash("sha256").update(`${email}:${code}`).digest("hex");
const cleanEmail = (email: unknown) => {
  const e = String(email ?? "").trim().toLowerCase();
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new HttpError(400, "That doesn't look like an email address.");
  return e;
};
/** Emails a code if the address bought a pass. Says nothing about whether it did, and sends at most one code a minute per address. */
export async function requestSignIn(db: Db, email: unknown, browserPlayerId: string, send: (to: string, code: string) => Promise<void>, now = Date.now()) {
  const e = cleanEmail(email);
  await db.delete(restoreTokens).where(lt(restoreTokens.expiresAt, new Date(now)));
  // the email's first purchase row is locked while checking and recording, so requests arriving together send one code; the email goes after
  const code = await db.transaction(async tx => {
    const [bought] = await tx.select({ email: purchases.email }).from(purchases).where(eq(purchases.email, e)).orderBy(asc(purchases.sessionId)).limit(1).for("update");
    if (!bought) return null;
    const [recent] = await tx.select({ token: restoreTokens.token }).from(restoreTokens)
      .where(and(eq(restoreTokens.email, e), gt(restoreTokens.expiresAt, new Date(now + (CODE_MINUTES - 1) * 60_000)))).limit(1);
    if (recent) return null;
    const c = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
    await tx.insert(restoreTokens).values({ token: newId(), email: e, playerId: browserPlayerId, codeHash: hashCode(e, c), expiresAt: new Date(now + CODE_MINUTES * 60_000) });
    return c;
  });
  if (code) await send(e, code);
}
/** Checks a typed code and answers with the account's player, which this browser then plays as. An email with no account yet
 *  becomes this browser's account: the person has just proved the mailbox is theirs, here. Each code allows CODE_TRIES guesses. */
export async function verifySignIn(db: Db, email: unknown, code: unknown, browserPlayerId: string, now = Date.now()): Promise<string> {
  const e = cleanEmail(email), c = String(code ?? "").replace(/\D/g, "");
  if (c.length !== 6) throw new HttpError(400, "Enter the 6-digit code from the email.");
  const [t] = await db.select().from(restoreTokens)
    .where(and(eq(restoreTokens.email, e), eq(restoreTokens.playerId, browserPlayerId), gt(restoreTokens.expiresAt, new Date(now))))
    .orderBy(desc(restoreTokens.expiresAt)).limit(1);
  // count the guess before checking it, so parallel guesses can't exceed the limit
  const [counted] = t ? await db.update(restoreTokens).set({ attempts: sql`${restoreTokens.attempts} + 1` })
    .where(and(eq(restoreTokens.token, t.token), lt(restoreTokens.attempts, CODE_TRIES))).returning({ token: restoreTokens.token }) : [];
  if (!t?.codeHash || !counted) throw new HttpError(400, "That code has expired. Ask for a new one.");
  if (!timingSafeEqual(Buffer.from(t.codeHash, "hex"), Buffer.from(hashCode(e, c), "hex"))) throw new HttpError(400, "That code isn't right. Check the email and try again.");
  await db.delete(restoreTokens).where(eq(restoreTokens.email, e));
  let [acct] = await db.select({ playerId: accounts.playerId }).from(accounts).where(eq(accounts.email, e));
  if (!acct) {
    const [other] = await db.select({ email: accounts.email }).from(accounts).where(eq(accounts.playerId, browserPlayerId));
    if (other) throw new HttpError(409, "This browser is signed in with another email. Sign out first, from your Passport.");
    await db.insert(accounts).values({ email: e, playerId: browserPlayerId });
    acct = { playerId: browserPlayerId };
  }
  await db.update(players).set({ unlocked: true }).where(eq(players.id, acct.playerId));
  // ponytail: this browser's own progress isn't merged in; an empty one is tidied away, one with plays stays as it was (the form says so)
  if (acct.playerId !== browserPlayerId) {
    const [played] = await db.select({ date: plays.date }).from(plays).where(eq(plays.playerId, browserPlayerId)).limit(1);
    const [owns] = await db.select({ email: accounts.email }).from(accounts).where(eq(accounts.playerId, browserPlayerId));
    if (!played && !owns) await db.delete(players).where(eq(players.id, browserPlayerId));
  }
  return acct.playerId;
}

/* ---- friend leagues ---- */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // no 0/O or 1/I
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
const MAX_LEAGUES = 10, MAX_MEMBERS = 50;
export async function createLeague(db: Db, playerId: string, name: unknown) {
  const mine = await db.select({ id: leagueMembers.leagueId }).from(leagueMembers).where(eq(leagueMembers.playerId, playerId));
  if (mine.length >= MAX_LEAGUES) throw new HttpError(400, `You can be in ${MAX_LEAGUES} leagues at most.`);
  const id = newId(8);
  for (let tries = 0; ; tries++) {
    try {
      const code = newCode();
      await db.insert(leagues).values({ id, code, name: cleanName(name) || "Friends league", ownerId: playerId });
      break;
    } catch (e) { if (tries > 4) throw e; }   // a code collision: try another
  }
  await db.insert(leagueMembers).values({ leagueId: id, playerId });
  return id;
}
export async function joinLeague(db: Db, playerId: string, code: unknown) {
  const c = String(code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const [l] = await db.select().from(leagues).where(eq(leagues.code, c));
  if (!l) throw new HttpError(404, "No league with that code. Check it with the friend who sent it.");
  const members = await db.select({ p: leagueMembers.playerId }).from(leagueMembers).where(eq(leagueMembers.leagueId, l.id));
  if (members.some(m => m.p === playerId)) return l.id;
  if (members.length >= MAX_MEMBERS) throw new HttpError(400, "That league is full.");
  const mine = await db.select({ id: leagueMembers.leagueId }).from(leagueMembers).where(eq(leagueMembers.playerId, playerId));
  if (mine.length >= MAX_LEAGUES) throw new HttpError(400, `You can be in ${MAX_LEAGUES} leagues at most.`);
  await db.insert(leagueMembers).values({ leagueId: l.id, playerId });
  return l.id;
}
export async function leaveLeague(db: Db, playerId: string, leagueId: string) {
  await db.delete(leagueMembers).where(and(eq(leagueMembers.leagueId, leagueId), eq(leagueMembers.playerId, playerId)));
}
export async function myLeagues(db: Db, playerId: string, today: string) {
  const mine = await db.select({ l: leagues }).from(leagueMembers).innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId)).where(eq(leagueMembers.playerId, playerId)).orderBy(asc(leagues.createdAt));
  if (!mine.length) return [];
  const ids = mine.map(m => m.l.id);
  const members = await db.select({ leagueId: leagueMembers.leagueId, id: players.id, name: players.name, passes: players.passes })
    .from(leagueMembers).innerJoin(players, eq(players.id, leagueMembers.playerId)).where(inArray(leagueMembers.leagueId, ids));
  const people = [...new Set(members.map(m => m.id))];
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekOf(today), i));
  const res = await db.select({ playerId: results.playerId, date: results.date, score: results.score }).from(results)
    .where(and(inArray(results.playerId, people), eq(results.onTime, true)));
  return mine.map(({ l }) => {
    const rows = members.filter(m => m.leagueId === l.id).map(m => {
      const mr = res.filter(r => r.playerId === m.id), inWeek = mr.filter(r => week.includes(r.date));
      return { name: m.name || "A traveller", you: m.id === playerId, total: inWeek.reduce((n, r) => n + r.score, 0), played: inWeek.length,
        todayScore: mr.find(r => r.date === today)?.score ?? null, streak: streakInfo(new Set(mr.map(r => r.date)), m.passes, today).n };
    }).sort((a, b) => b.total - a.total || (b.todayScore ?? -1) - (a.todayScore ?? -1) || a.name.localeCompare(b.name));
    return { id: l.id, name: l.name, code: l.code, owner: l.ownerId === playerId, weekStart: week[0], members: rows };
  });
}

/* ---- feedback ---- */
export const FEEDBACK_PER_DAY = 5;
const oneLine = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
/** A message from the feedback link. Kept for the admin page; the context is only what a bug report needs, and only in known shapes. */
export async function sendFeedback(db: Db, playerId: string, input: Record<string, unknown>, userAgent: string | null) {
  const message = String(input.message ?? "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, 1000);   // keeps line breaks
  if (message.length < 3) throw new HttpError(400, "Write a few words first.");
  const email = oneLine(input.email, 200).toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "That email doesn't look right. Leave it empty if you don't need a reply.");
  const c = (input.context ?? {}) as Record<string, unknown>, context: Record<string, string> = {};
  if (typeof c.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.date)) context.date = c.date;
  if (typeof c.flight === "string" && /^\d{1,4}$/.test(c.flight)) context.flight = c.flight;
  if (Number.isInteger(c.stop) && (c.stop as number) >= 1 && (c.stop as number) <= ROUNDS_PER_DAY) context.stop = String(c.stop);
  if (typeof c.screen === "string" && /^[a-z]{1,12}$/.test(c.screen)) context.screen = c.screen;
  if (typeof c.look === "string" && THEMES.some(t => t.id === c.look)) context.look = c.look;
  if (typeof c.size === "string" && /^\d{2,5}x\d{2,5}$/.test(c.size)) context.size = c.size;
  if (userAgent) context.browser = oneLine(userAgent, 200);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(feedback)
    .where(and(eq(feedback.playerId, playerId), gt(feedback.createdAt, sql`now() - interval '1 day'`)));
  if (n >= FEEDBACK_PER_DAY) throw new HttpError(429, "Thanks, that's plenty for today. Send more tomorrow.");
  const row = { id: newId(8), playerId, message, email, context };
  await db.insert(feedback).values(row);
  return row;
}
/** How many messages arrived in the last hour, from anyone: past a few dozen it's a flood, so the route stops emailing (all are still kept). */
export async function feedbackLastHour(db: Db) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(feedback).where(gt(feedback.createdAt, sql`now() - interval '1 hour'`));
  return n;
}
export const feedbackList = (db: Db) => db.select().from(feedback).orderBy(asc(feedback.done), desc(feedback.createdAt)).limit(100);
export const markFeedback = (db: Db, id: string, done: boolean) => db.update(feedback).set({ done }).where(eq(feedback.id, id));

/* ---- retention, for /admin ---- */
const SHARE_VIA = ["native", "whatsapp", "messages", "x", "copy"] as const;
/** A tap on a share button. Counted once per player, flight and channel, and only for a flight the player has finished. */
export async function recordShare(db: Db, playerId: string, date: unknown, via: unknown) {
  if (typeof date !== "string" || !SHARE_VIA.includes(via as never)) throw new HttpError(400, "Unknown share.");
  const [done] = await db.select({ d: results.date }).from(results).where(and(eq(results.playerId, playerId), eq(results.date, date)));
  if (done) await db.insert(shares).values({ playerId, date, via: via as (typeof SHARE_VIA)[number] }).onConflictDoNothing();
  return { ok: true as const };
}

/**
 * Who comes back. A player counts as active on a game day when they touched a stop that day (today's flight or the archive);
 * visitors who never start a stop don't count. Day-N return: of players whose first day is at least N full days ago, how many played exactly N days later.
 */
// ponytail: reads every (player, day) pair into memory; move the grouping into SQL past ~100k plays
export async function retention(db: Db, today: string) {
  const tz = process.env.GAME_TIMEZONE || "UTC", dayOf = (col: typeof plays.updatedAt | typeof results.completedAt | typeof shares.at) => sql<string>`to_char(${col} at time zone ${tz}, 'YYYY-MM-DD')`;
  const [active, finished, shared, byVia] = await Promise.all([
    db.selectDistinct({ id: plays.playerId, day: dayOf(plays.updatedAt) }).from(plays),
    db.select({ day: dayOf(results.completedAt), n: sql<number>`count(*)::int` }).from(results).groupBy(sql`1`),
    db.select({ day: dayOf(shares.at), n: sql<number>`count(distinct ${shares.playerId})::int` }).from(shares).groupBy(sql`1`),
    db.select({ via: shares.via, n: sql<number>`count(*)::int` }).from(shares).where(sql`${shares.at} > now() - interval '14 days'`).groupBy(shares.via),
  ]);
  const days = new Map<string, Set<string>>();
  for (const { id, day } of active) days.set(id, (days.get(id) ?? new Set()).add(day));
  const first = new Map([...days].map(([id, set]) => [id, [...set].sort()[0]]));
  const daily = Array.from({ length: 14 }, (_, k) => addDays(today, -k)).map(day => {
    const on = [...days].filter(([, set]) => set.has(day)).map(([id]) => id), fresh = on.filter(id => first.get(id) === day).length;
    return { day, players: on.length, fresh, back: on.length - fresh, finished: finished.find(f => f.day === day)?.n ?? 0, shared: shared.find(f => f.day === day)?.n ?? 0 };
  });
  const rates = [1, 7, 30].map(after => {
    const due = [...first].filter(([, d]) => addDays(d, after) < today);   // that later day is over
    return { after, of: due.length, back: due.filter(([id, d]) => days.get(id)!.has(addDays(d, after))).length };
  });
  // each source's players through the funnel; "visited" counts only tagged sources, since untagged visits include every bot
  const [marked, done, sent] = await Promise.all([
    db.select({ id: players.id, source: players.source, look: players.look }).from(players).where(sql`${players.source} is not null or ${players.look} is not null`),
    db.selectDistinct({ id: results.playerId }).from(results),
    db.selectDistinct({ id: shares.playerId }).from(shares),
  ]);
  const tagged = marked.filter(t => t.source), lookOf = new Map(marked.map(t => [t.id, t.look]));
  const sourceOf = new Map(tagged.map(t => [t.id, t.source!])), doneSet = new Set(done.map(d => d.id)), sentSet = new Set(sent.map(s => s.id));
  const bySource = new Map<string, { source: string; visited: number | null; started: number; finished: number; back: number; shared: number }>();
  const row = (source: string | undefined) => {
    const k = source ?? "untagged";
    if (!bySource.has(k)) bySource.set(k, { source: k, visited: source ? 0 : null, started: 0, finished: 0, back: 0, shared: 0 });
    return bySource.get(k)!;
  };
  for (const t of tagged) row(t.source!).visited!++;
  for (const [id, set] of days) { const r = row(sourceOf.get(id)); r.started++; if (doneSet.has(id)) r.finished++; if (set.size > 1) r.back++; if (sentSet.has(id)) r.shared++; }
  const sources = [...bySource.values()].sort((a, b) => b.started - a.started || (b.visited ?? 0) - (a.visited ?? 0));
  // which look each player who has started a flight is on; a browser that never reported one counts as classic
  const looks = THEMES.map(t => {
    const on = [...days].filter(([id]) => (lookOf.get(id) ?? "classic") === t.id);
    return { look: t.name, players: on.length, back: on.filter(([, set]) => set.size > 1).length };
  });
  return { players: days.size, daily, rates, byVia: Object.fromEntries(byVia.map(r => [r.via, r.n])) as Record<string, number>, sources, looks };
}
