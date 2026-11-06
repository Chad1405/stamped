// Everything the API does, as plain functions over a Db, so tests can drive them without HTTP.
import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { itineraries, leagueMembers, leagues, players, plays, results, stamps, stopStats } from "@/db/schema";
import { applyAction, freshStop, type Action, type Event, type Round, type StopState } from "@/lib/game/engine";
import { countryByName } from "@/lib/game/match";
import { CONT, CONT3, NAMED_CITY, NAMED_COUNTRY, ROUNDS_PER_DAY, TIERS, type TierId, kmBetween } from "@/lib/game/rules";
import { addDays, streakInfo, weekOf } from "@/lib/game/streak";
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
export const cleanName = (s: unknown) => String(s ?? "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
export async function setName(db: Db, playerId: string, name: unknown) {
  await db.update(players).set({ name: cleanName(name) }).where(eq(players.id, playerId));
}

/* ---- content ---- */
/** Sample content until an editor tool exists: the sample days rotate, so today and the three days before it always have a flight.
 *  The first seed puts the newest sample on today; each later date takes the next sample in turn and the next flight number. */
const SAMPLES = (seedDays as { offset: number; rounds: Round[] }[]).toSorted((a, b) => a.offset - b.offset);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
export async function seedSamples(db: Db, today: string) {
  const [{ first }] = await db.select({ first: sql<string | null>`min(${itineraries.date})` }).from(itineraries);
  const anchor = first ?? addDays(today, -(SAMPLES.length - 1));
  const rows = Array.from({ length: SAMPLES.length }, (_, k) => addDays(today, -k)).filter(d => d >= anchor).map(date => {
    const n = daysBetween(anchor, date);
    return { date, flight: String(n + 1).padStart(3, "0"), rounds: SAMPLES[n % SAMPLES.length].rounds };
  });
  await db.insert(itineraries).values(rows).onConflictDoNothing({ target: itineraries.date });   // never replaces a flight that already exists
  // flights copied from a sample follow later edits to the sample file; a real flight never shares a sample's prompts, so it is never touched
  // ponytail: reads every flight once a day per server; drop this when real itineraries replace the samples
  for (const row of await db.select({ date: itineraries.date, rounds: itineraries.rounds }).from(itineraries)) {
    const rounds = row.rounds as Round[], same = SAMPLES.find(x => x.rounds.length === rounds.length && x.rounds.every((r, i) => r.prompt === rounds[i].prompt));
    if (same && JSON.stringify(same.rounds) !== JSON.stringify(rounds)) await db.update(itineraries).set({ rounds: same.rounds }).where(eq(itineraries.date, row.date));
  }
}
async function itinerary(db: Db, date: string, today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) throw new HttpError(404, "No flight on that date.");
  const [it] = await db.select().from(itineraries).where(eq(itineraries.date, date));
  if (!it) throw new HttpError(404, "No flight on that date.");
  return it;
}

/* ---- what the browser may see ---- */
const citiesFor = (r: Round) => [...new Set([...(CITIES[r.country] ?? []), r.cityName])].sort((a, b) => a.localeCompare(b));
/** Before a stop is finished: the clue and nothing that names the answer. */
const publicRound = (r: Round, i: number) => ({
  stop: i, type: r.type, prompt: r.prompt, img: r.img ?? null, alt: r.alt ?? null, postcard: r.postcard ?? null, spotLabel: r.spotLabel, cities: citiesFor(r),
});
export const codeFor = (r: Round, tier: TierId) => {
  if (tier === "native" || tier === "local") return r.airport;
  if (tier === "miss") return "???";
  if (tier === "tourist") return CONT3[countryByName(r.country)!.cont[0]];
  return ISO3[r.country] ?? r.country.slice(0, 3).toUpperCase();
};
export const placeFor = (r: Round, tier: TierId) =>
  tier === "native" || tier === "local" ? r.cityName : tier === "traveller" ? r.regionName : tier === "backpacker" || tier === "lost" ? r.country
    : tier === "tourist" ? CONT[countryByName(r.country)!.cont[0]] : "No entry";
const MIN_LIVE_PLAYERS = 20;   // below this, show the editor's estimate instead of a noisy percentage
function reveal(r: Round, tier: TierId, stats?: typeof stopStats.$inferSelect, prev?: Round, guesses: string[] = []) {
  const km = prev ? kmBetween(prev, r) : null;
  const guess = (tier === "tourist" || tier === "miss") && guesses[0] && guesses[0] !== r.country ? guesses[0] : undefined, cap = guess ? CAPITALS[guess] : undefined;
  const offKm = cap ? kmBetween({ lat: cap[1], lng: cap[2] }, r) : null;
  const live = stats && stats.players >= MIN_LIVE_PLAYERS;
  const pct = (n: number) => Math.round(100 * n / stats!.players);
  return {
    country: r.country, regionName: r.regionName, cityName: r.cityName, spotName: r.spotName, airport: r.airport, fact: r.fact, credit: r.credit ?? null,
    code: codeFor(r, tier), place: placeFor(r, tier),
    leg: km === null ? null : { from: prev!.cityName, km },   // the flight in from the previous stop
    off: offKm === null ? null : { guess: guess!, capital: cap![0], km: offKm },   // a wrong country: how far off it was (shown, not scored)
    crowd: live ? { source: "live" as const, players: stats!.players, values: [pct(stats!.country), pct(stats!.city), pct(stats!.spot)] }
                : { source: "estimate" as const, players: stats?.players ?? 0, values: r.crowd },
  };
}
const stopView = (s: StopState) => ({ phase: s.phase, step: s.step, banked: s.banked, next: s.next, guesses: s.guesses, endsAt: s.endsAt, tier: s.tier, note: s.note });

/* ---- a day ---- */
export async function getDay(db: Db, playerId: string, date: string, today: string) {
  const it = await itinerary(db, date, today);
  const [rows, stats] = await Promise.all([
    db.select().from(plays).where(and(eq(plays.playerId, playerId), eq(plays.date, date))),
    db.select().from(stopStats).where(eq(stopStats.date, date)),
  ]);
  const stops = it.rounds.map((r, i) => {
    const s = rows.find(x => x.stop === i)?.state ?? freshStop();
    return { ...publicRound(r, i), state: stopView(s), reveal: s.phase === "done" && s.tier ? reveal(r, s.tier, stats.find(x => x.stop === i), it.rounds[i - 1], s.guesses) : null };
  });
  const score = stops.reduce((n, s) => n + (s.state.tier ? TIERS[s.state.tier].score : 0), 0);
  return { date, flight: it.flight, isToday: date === today, serverNow: Date.now(), score, stops };
}

/* ---- playing ---- */
export type ActResult = {
  stop: ReturnType<typeof publicRound> & { state: ReturnType<typeof stopView>; reveal: ReturnType<typeof reveal> | null };
  event: Event; gain: { country?: string; city?: string; rare?: string } | null; dayDone: boolean; serverNow: number;
};
export async function act(db: Db, playerId: string, date: string, stop: number, action: Action, today: string, now = Date.now()): Promise<ActResult> {
  const it = await itinerary(db, date, today);
  if (!Number.isInteger(stop) || stop < 0 || stop >= it.rounds.length) throw new HttpError(400, "No such stop.");
  const r = it.rounds[stop];
  return db.transaction(async tx => {
    const done = await tx.select({ stop: plays.stop, state: plays.state }).from(plays).where(and(eq(plays.playerId, playerId), eq(plays.date, date))).for("update");
    for (let i = 0; i < stop; i++) if (done.find(d => d.stop === i)?.state.phase !== "done") throw new HttpError(409, "Finish the earlier stops first.");
    const before = done.find(d => d.stop === stop)?.state ?? freshStop();
    const { state, event } = applyAction(r, before, action, now);
    if (state !== before) await tx.insert(plays).values({ playerId, date, stop, state }).onConflictDoUpdate({ target: [plays.playerId, plays.date, plays.stop], set: { state, updatedAt: new Date() } });
    let gain: ActResult["gain"] = null, dayDone = false;
    if (event.kind === "finished") {
      gain = await stampPassport(tx as Db, playerId, r, event.tier, date);
      await tx.insert(stopStats).values({ date, stop, players: 1, country: +NAMED_COUNTRY.includes(event.tier), city: +NAMED_CITY.includes(event.tier), spot: +(event.tier === "native") })
        .onConflictDoUpdate({ target: [stopStats.date, stopStats.stop], set: {
          players: sql`${stopStats.players} + 1`, country: sql`${stopStats.country} + ${+NAMED_COUNTRY.includes(event.tier)}`,
          city: sql`${stopStats.city} + ${+NAMED_CITY.includes(event.tier)}`, spot: sql`${stopStats.spot} + ${+(event.tier === "native")}` } });
      const all = it.rounds.map((_, i) => i === stop ? state : done.find(d => d.stop === i)?.state);
      if (all.every(s => s?.phase === "done")) {
        dayDone = true;
        const tiers = all.map(s => s!.tier!);
        await tx.insert(results).values({ playerId, date, score: tiers.reduce((n, t) => n + TIERS[t].score, 0), tiers, onTime: date === today }).onConflictDoNothing();
      }
    }
    const [stats] = state.phase === "done" ? await tx.select().from(stopStats).where(and(eq(stopStats.date, date), eq(stopStats.stop, stop))) : [];
    return { stop: { ...publicRound(r, stop), state: stopView(state), reveal: state.phase === "done" && state.tier ? reveal(r, state.tier, stats, it.rounds[stop - 1], state.guesses) : null }, event, gain, dayDone, serverNow: now };
  });
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
  return info;
}
export async function getMe(db: Db, playerId: string, today: string) {
  const [p] = await db.select().from(players).where(eq(players.id, playerId));
  const [streak, myStamps, myResults, days, progress] = await Promise.all([
    streakFor(db, playerId, today, true),
    db.select().from(stamps).where(eq(stamps.playerId, playerId)).orderBy(asc(stamps.firstDate)),
    db.select().from(results).where(eq(results.playerId, playerId)),
    db.select({ date: itineraries.date, flight: itineraries.flight }).from(itineraries).where(lte(itineraries.date, today)).orderBy(desc(itineraries.date)).limit(30),
    db.select({ date: plays.date, n: sql<number>`count(*) filter (where ${plays.state}->>'phase' = 'done')::int` }).from(plays).where(eq(plays.playerId, playerId)).groupBy(plays.date),
  ]);
  const onTime = myResults.filter(r => r.onTime);
  return {
    id: playerId, name: p?.name ?? "", today, streak,
    record: { flights: onTime.length, best: Math.max(0, ...onTime.map(r => r.score)) },
    passport: {
      countries: myStamps.filter(s => s.kind === "country").map(s => ({ name: s.key, first: s.firstDate, code: s.meta.code, cont: s.meta.cont })),
      cities: myStamps.filter(s => s.kind === "city").map(s => ({ name: s.key, first: s.firstDate, airport: s.meta.airport })),
      rare: myStamps.filter(s => s.kind === "rare").map(s => ({ spot: s.key, first: s.firstDate, airport: s.meta.airport, city: s.meta.city })),
    },
    days: days.map(d => {
      const res = myResults.find(r => r.date === d.date);
      return { date: d.date, flight: d.flight, isToday: d.date === today, score: res?.score ?? null, stopsDone: res ? ROUNDS_PER_DAY : progress.find(x => x.date === d.date)?.n ?? 0 };
    }),
  };
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
