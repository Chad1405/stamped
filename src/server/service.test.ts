// Drives the service against an in-memory Postgres: the same SQL the hosted database runs.
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import seedDays from "@/content/itineraries.json";
import { act, createLeague, dailyCalendarCheck, ensurePlayer, fieldFor, forgetPlayer, getDay, retention, getMe, HttpError, joinLeague, keepCalendar, myLeagues, recordPurchase, redeemRestore, requestRestore, seedSamples, setName } from "./service";
import { addDays } from "@/lib/game/streak";
import { itineraries, leagues, plays, players, purchases, results } from "@/db/schema";
import { freshStop } from "@/lib/game/engine";
import type { Round } from "@/lib/game/engine";
import { PREVIEW_MS } from "@/lib/game/rules";

const TODAY = "2026-11-05";
const rounds = (seedDays as { offset: number; rounds: { country: string; cityName: string; spot: string[] }[] }[]).find(d => d.offset === 0)!.rounds;
let db: Db;
beforeAll(async () => { db = await createDb(); await seedSamples(db, TODAY); });

describe("sample flights", () => {
  it("rotate so every new day has a flight, without touching earlier ones", async () => {
    const fresh = await createDb(), next = addDays(TODAY, 1), pid = await ensurePlayer(fresh, undefined);
    const samples = (seedDays as { offset: number; rounds: { prompt: string }[] }[]).toSorted((a, b) => a.offset - b.offset), n = samples.length;
    const flightNo = (k: number) => String(k).padStart(3, "0");
    await seedSamples(fresh, TODAY);
    expect((await getDay(fresh, pid, TODAY, TODAY)).flight).toBe(flightNo(n));   // the first seed puts the newest sample on today
    await seedSamples(fresh, next); await seedSamples(fresh, next);   // a second call the same day adds nothing
    const tomorrow = await getDay(fresh, pid, next, next);
    expect(tomorrow.flight).toBe(flightNo(n + 1));
    expect(tomorrow.stops[0].prompt).toBe(samples[0].rounds[0].prompt);   // then the rotation starts again from the oldest
    expect((await getDay(fresh, pid, TODAY, next)).flight).toBe(flightNo(n));
  });
  it("are scheduled 14 days ahead, and players can't reach them early", async () => {
    const fresh = await createDb(), pid = await ensurePlayer(fresh, undefined);
    expect((await keepCalendar(fresh, TODAY, true))).toEqual({ ahead: 14, replayed: [] });
    await expect(getDay(fresh, pid, addDays(TODAY, 1), TODAY)).rejects.toThrow(HttpError);
    expect((await getMe(fresh, pid, TODAY)).days.every(d => d.date <= TODAY)).toBe(true);
  });
  it("replay the longest-unseen flight rather than leave a day empty", async () => {
    const fresh = await createDb(), sample = (seedDays as { offset: number; rounds: Round[] }[]);
    const a = sample[0].rounds, b = sample[1].rounds, next = addDays(TODAY, 1), after = addDays(TODAY, 2);
    await fresh.insert(itineraries).values([{ date: addDays(TODAY, -2), flight: "001", rounds: a }, { date: addDays(TODAY, -1), flight: "002", rounds: b }]);
    expect(await keepCalendar(fresh, TODAY, false)).toEqual({ ahead: 1, replayed: [TODAY, next] });
    const rows = async () => Object.fromEntries((await fresh.select().from(itineraries)).map(r => [r.date, r]));
    expect([(await rows())[TODAY].rounds, (await rows())[next].rounds]).toEqual([a, b]);
    expect((await rows())[TODAY].flight).toBe("003");
    expect(await keepCalendar(fresh, next, false)).toEqual({ ahead: 1, replayed: [after] });   // today already exists; only the day after is new
    expect((await rows())[after].rounds).toEqual(a);   // a was last shown before b
    expect(await keepCalendar(await createDb(), TODAY, false)).toEqual({ ahead: 0, replayed: [] });   // an empty database has nothing to replay
  });
  it("warn once the calendar is running low, and not before", async () => {
    const sent: string[] = [], warn = async (subject: string) => { sent.push(subject); };
    const full = await createDb();
    await dailyCalendarCheck(full, TODAY, warn, true);
    expect(sent).toEqual([]);
    const low = await createDb(), rounds = (seedDays as { rounds: Round[] }[])[0].rounds;
    await low.insert(itineraries).values(Array.from({ length: 7 }, (_, k) => ({ date: addDays(TODAY, k), flight: String(k + 1).padStart(3, "0"), rounds })));
    expect((await dailyCalendarCheck(low, TODAY, warn, false)).ahead).toBe(6);
    expect(sent).toEqual(["Born There: only 6 days of flights ready"]);
    await low.insert(itineraries).values({ date: addDays(TODAY, 7), flight: "008", rounds });
    await dailyCalendarCheck(low, TODAY, warn, false);
    expect(sent).toHaveLength(1);   // 7 days ahead is enough
  });
  it("pick up edits to the sample file, and never touch a real flight", async () => {
    const fresh = await createDb(), pid = await ensurePlayer(fresh, undefined), sample = (seedDays as { offset: number; rounds: Round[] }[]).find(d => d.offset === 0)!;
    const stale = sample.rounds.map(r => ({ ...r, fact: "old copy" })), real = sample.rounds.map(r => ({ ...r, img: r.img && `${r.img}?real`, postcard: r.postcard && { ...r.postcard, text: "A real message" } }));
    await fresh.insert(itineraries).values([{ date: TODAY, flight: "004", rounds: stale }, { date: addDays(TODAY, -1), flight: "003", rounds: real }]);
    await seedSamples(fresh, TODAY);
    const rows = Object.fromEntries((await fresh.select().from(itineraries)).map(r => [r.date, r.rounds as Round[]]));
    expect(rows[TODAY]).toEqual(sample.rounds);
    expect(rows[addDays(TODAY, -1)]).toEqual(real);
    expect((await getDay(fresh, pid, TODAY, TODAY)).stops.find(s => s.postcard)?.postcard?.from).toMatch(/^\+372/);
  });
  it("reorder a sample flight only before anyone has played it", async () => {
    const fresh = await createDb(), pid = await ensurePlayer(fresh, undefined), sample = (seedDays as { offset: number; rounds: Round[] }[]).find(d => d.offset === 0)!;
    const old = sample.rounds.toReversed(), played = addDays(TODAY, -1);
    const stale = old.map(r => ({ ...r, spotLabel: "Name the old wording" }));
    await fresh.insert(itineraries).values([{ date: TODAY, flight: "004", rounds: stale }, { date: played, flight: "003", rounds: stale }]);
    await act(fresh, pid, played, 0, { type: "start" }, TODAY);
    await seedSamples(fresh, TODAY);
    const rows = Object.fromEntries((await fresh.select().from(itineraries)).map(r => [r.date, r.rounds as Round[]]));
    expect(rows[TODAY]).toEqual(sample.rounds);
    expect(rows[played]).toEqual(old);   // same order as when it was played, with the new wording
  });
});

async function playDay(pid: string, date: string, how: "perfect" | "bank", t0 = Date.now()) {
  const day = await getDay(db, pid, date, TODAY);
  const content = (seedDays as { offset: number; rounds: { country: string; cityName: string; spot: string[] }[] }[]).find(d => addDays(TODAY, d.offset) === date)!.rounds;
  for (let i = 0; i < day.stops.length; i++) {
    const r = content[i], t = t0 + PREVIEW_MS;
    await act(db, pid, date, i, { type: "start" }, TODAY, t0);
    await act(db, pid, date, i, { type: "guess", text: r.country }, TODAY, t);
    if (how === "bank") { await act(db, pid, date, i, { type: "decide", deeper: false }, TODAY, t); continue; }
    await act(db, pid, date, i, { type: "decide", deeper: true }, TODAY, t);
    await act(db, pid, date, i, { type: "guess", text: r.cityName }, TODAY, t);
    await act(db, pid, date, i, { type: "decide", deeper: true }, TODAY, t);
    await act(db, pid, date, i, { type: "guess", text: r.spot[0] }, TODAY, t);
  }
}

describe("a day on the server", () => {
  it("three tries with clues; a missed stop says how far off the last try was", async () => {
    const t0 = Date.now(), t = t0 + PREVIEW_MS + 1000, tries = async (...countries: string[]) => {
      const pid = await ensurePlayer(db, undefined);
      await act(db, pid, TODAY, 0, { type: "start" }, TODAY, t0);
      const out = [];
      for (const text of countries) out.push(await act(db, pid, TODAY, 0, { type: "guess", text }, TODAY, t));
      return out;
    };
    // today's first stop is Hallgrímskirkja, Reykjavík
    const [first, second] = await tries("Spain", "Portugal");
    expect(first.event.kind).toBe("wrong");
    expect(first.stop.state.clues?.tries[0]).toEqual(expect.objectContaining({ name: "Spain", capital: "Madrid", arrow: "↖" }));
    expect(first.stop.state.clues?.continent).toBeNull();
    expect(second.stop.state.clues?.continent).toBe("Europe");
    expect(first.stop.reveal).toBeNull();
    const near = (await tries("Spain", "Portugal", "Norway")).at(-1)!.stop;
    expect(near.state.tier).toBe("tourist");
    expect(near.state.points).toBe(10);
    expect(near.reveal?.off).toEqual({ guess: "Norway", capital: "Oslo", km: expect.any(Number) });
    expect(near.reveal!.off!.km).toBeGreaterThan(1600); expect(near.reveal!.off!.km).toBeLessThan(1900);   // Oslo to Reykjavík, about 1,750 km
    const far = (await tries("Japan", "China", "India")).at(-1)!.stop;
    expect(far.state.tier).toBe("miss");
    expect(far.reveal!.off!.capital).toBe("New Delhi");
    const pid = await ensurePlayer(db, undefined);
    await act(db, pid, TODAY, 0, { type: "start" }, TODAY, t0);
    await act(db, pid, TODAY, 0, { type: "guess", text: "Spain" }, TODAY, t);
    await act(db, pid, TODAY, 0, { type: "guess", text: "Iceland" }, TODAY, t);
    expect((await act(db, pid, TODAY, 0, { type: "decide", deeper: false }, TODAY, t)).stop.state.points).toBe(20);   // right on the second try: 30, less 10
    expect((await getDay(db, pid, TODAY, TODAY)).score).toBe(20);
    const banker = await ensurePlayer(db, undefined);
    await playDay(banker, TODAY, "bank");
    expect((await getDay(db, banker, TODAY, TODAY)).stops.every(s => s.reveal?.off === null)).toBe(true);   // right countries show nothing
  });
  it("never sends an answer before its stop is finished", async () => {
    const pid = await ensurePlayer(db, undefined);
    const day = await getDay(db, pid, TODAY, TODAY);
    const text = JSON.stringify(day);
    for (const r of rounds) { expect(text).not.toContain(`"${r.country}"`); expect(text).not.toContain(`"${r.cityName}"`); expect(text).not.toContain(r.spot[0]); }
    expect(day.stops.every(s => s.reveal === null && s.cities.length === 0 && s.spotLabel === null && s.spotWord === null)).toBe(true);   // the city list and the final question narrow down the country
    const t0 = Date.now(), t = t0 + PREVIEW_MS;
    expect((await act(db, pid, TODAY, 0, { type: "start" }, TODAY, t0)).stop.cities).toEqual([]);
    const wrong = (await act(db, pid, TODAY, 0, { type: "guess", text: "Spain" }, TODAY, t)).stop;
    expect([wrong.cities, wrong.spotWord]).toEqual([[], null]);
    expect((await act(db, pid, TODAY, 0, { type: "guess", text: rounds[0].country }, TODAY, t)).stop.cities).toContain(rounds[0].cityName);
    const reloaded = (await getDay(db, pid, TODAY, TODAY)).stops[0];   // and it survives a reload
    expect(reloaded.cities).toContain(rounds[0].cityName);
    expect([reloaded.spotLabel, reloaded.spotWord]).toEqual(["What is this landmark called?", "Landmark"]);
    const missed = await ensurePlayer(db, undefined);   // a missed stop never banks the country, and its reveal still needs the word
    await act(db, missed, TODAY, 0, { type: "start" }, TODAY, t0);
    for (const text of ["Japan", "China", "India"]) await act(db, missed, TODAY, 0, { type: "guess", text }, TODAY, t);
    expect((await getDay(db, missed, TODAY, TODAY)).stops[0].spotWord).toBe("Landmark");
  });
  it("refuses future dates and out-of-order stops", async () => {
    const pid = await ensurePlayer(db, undefined);
    await expect(getDay(db, pid, addDays(TODAY, 1), TODAY)).rejects.toBeInstanceOf(HttpError);
    await expect(act(db, pid, TODAY, 2, { type: "start" }, TODAY)).rejects.toMatchObject({ status: 409 });
  });
  it("a perfect day scores 500, stamps the passport and records a result", async () => {
    const pid = await ensurePlayer(db, undefined);
    await playDay(pid, TODAY, "perfect");
    const day = await getDay(db, pid, TODAY, TODAY);
    expect(day.score).toBe(500);
    expect(day.stops[0].reveal).toEqual(expect.objectContaining({ cityName: "Reykjavík", code: "KEF" }));
    const me = await getMe(db, pid, TODAY);
    expect(me.passport.countries).toHaveLength(5);
    expect(me.passport.rare).toHaveLength(5);
    expect(me.streak.n).toBe(1);
    expect(me.days.find(d => d.date === TODAY)?.score).toBe(500);
  });
  it("finished stops cannot be replayed for a better score", async () => {
    const pid = await ensurePlayer(db, undefined);
    await playDay(pid, TODAY, "bank");
    const again = await act(db, pid, TODAY, 0, { type: "start" }, TODAY);
    expect(again.event.kind).toBe("ignored");
    expect((await getDay(db, pid, TODAY, TODAY)).score).toBe(150);
  });
  it("archive days add passport stamps but never streak days", async () => {
    const pid = await ensurePlayer(db, undefined);
    await db.update(players).set({ unlocked: true }).where(eq(players.id, pid));   // older than yesterday: needs the archive pass
    await playDay(pid, addDays(TODAY, -3), "bank");
    const me = await getMe(db, pid, TODAY);
    expect(me.passport.countries).toHaveLength(5);
    expect(me.streak.n).toBe(0);
    expect(me.record.flights).toBe(0);
  });
});

describe("leagues", () => {
  it("friends join by code and rank by this week's total", async () => {
    const a = await ensurePlayer(db, undefined), b = await ensurePlayer(db, undefined);
    await setName(db, a, "Alice"); await setName(db, b, "  Bob\u0007 ");
    const id = await createLeague(db, a, "Office trip");
    const [league] = await myLeagues(db, a, TODAY);
    expect(league.code).toMatch(/^[A-Z2-9]{6}$/);
    await joinLeague(db, b, league.code.toLowerCase());
    await playDay(a, TODAY, "perfect"); await playDay(b, TODAY, "bank");
    const [board] = await myLeagues(db, b, TODAY);
    expect(board.id).toBe(id);
    expect(board.members.map(m => [m.name, m.total, m.you])).toEqual([["Alice", 500, false], ["Bob", 150, true]]);
  });
  it("rejects an unknown code", async () => {
    const p = await ensurePlayer(db, undefined);
    await expect(joinLeague(db, p, "ZZZZZZ")).rejects.toMatchObject({ status: 404 });
  });
});

describe("how a day compares", () => {
  it("says what share of the other players you beat, once 20 others have finished", async () => {
    const db = await createDb();
    await keepCalendar(db, TODAY);
    const finish = async (score: number) => { const id = await ensurePlayer(db, undefined); await db.insert(results).values({ playerId: id, date: TODAY, score, tiers: [], onTime: true }); return id; };
    const me = await finish(300);
    for (let k = 0; k < 19; k++) await finish(k * 20);   // 0 to 360
    expect(await fieldFor(db, me, TODAY)).toBeNull();   // 19 others: too few to say
    await finish(380);
    expect(await fieldFor(db, me, TODAY)).toEqual({ players: 21, better: 75 });   // 15 of the 20 others scored less
    expect(await fieldFor(db, await ensurePlayer(db, undefined), TODAY)).toBeNull();   // not finished: nothing to compare
  });
});

describe("retention", () => {
  it("counts who came back 1, 7 and 30 days after their first day", async () => {
    const db = await createDb();
    await keepCalendar(db, TODAY);
    const history = async (...days: string[]) => { const id = await ensurePlayer(db, undefined);
      await db.insert(plays).values(days.map((d, stop) => ({ playerId: id, date: TODAY, stop, state: freshStop(), updatedAt: new Date(`${d}T12:00:00Z`) }))); };
    await history("2026-10-01", "2026-10-02", "2026-10-08", "2026-10-31");   // back after 1, 7 and 30 days
    await history("2026-10-01");                                             // never back
    await history("2026-10-28", "2026-10-29");                               // back after 1; too new for 30
    await history("2026-11-04", "2026-11-05");                               // too new for any: day 1 is today, not over yet
    await ensurePlayer(db, undefined);                                      // opened the site, never started a stop: not counted
    const r = await retention(db, TODAY);
    expect(r.players).toBe(4);
    expect(r.rates).toEqual([{ after: 1, of: 3, back: 2 }, { after: 7, of: 3, back: 1 }, { after: 30, of: 2, back: 1 }]);
    expect(r.daily.slice(0, 2)).toEqual([{ day: "2026-11-05", players: 1, fresh: 0, back: 1, finished: 0 }, { day: "2026-11-04", players: 1, fresh: 1, back: 0, finished: 0 }]);
  });
});

describe("deleting a player", () => {
  it("removes everything kept about them, and their leagues, but nobody else's", async () => {
    const db = await createDb();
    await keepCalendar(db, TODAY);
    const [me, other] = [await ensurePlayer(db, undefined), await ensurePlayer(db, undefined)];
    for (const id of [me, other]) await db.insert(results).values({ playerId: id, date: TODAY, score: 100, tiers: [], onTime: true });
    await db.insert(plays).values({ playerId: me, date: TODAY, stop: 0, state: freshStop() });
    await createLeague(db, me, "Mine");
    await forgetPlayer(db, me);
    expect((await db.select().from(players)).map(p => p.id)).toEqual([other]);
    expect((await db.select().from(results)).map(r => r.playerId)).toEqual([other]);
    expect(await db.select().from(plays)).toEqual([]);
    expect(await db.select().from(leagues)).toEqual([]);
  });
});

describe("archive pass", () => {
  const OLD = addDays(TODAY, -3), YESTERDAY = addDays(TODAY, -1);
  it("keeps older flights for pass holders, and for anyone who'd already started one", async () => {
    const fresh = await createDb(); await seedSamples(fresh, TODAY);
    const pid = await ensurePlayer(fresh, undefined);
    await getDay(fresh, pid, YESTERDAY, TODAY);   // yesterday is free
    await expect(getDay(fresh, pid, OLD, TODAY)).rejects.toMatchObject({ status: 402 });
    await expect(act(fresh, pid, OLD, 0, { type: "start" }, TODAY)).rejects.toMatchObject({ status: 402 });
    expect((await getMe(fresh, pid, TODAY)).days.find(d => d.date === OLD)?.locked).toBe(true);

    const early = await ensurePlayer(fresh, undefined);   // played this flight before the pass existed
    await fresh.insert(plays).values({ playerId: early, date: OLD, stop: 0, state: freshStop() });
    await getDay(fresh, early, OLD, TODAY);

    await recordPurchase(fresh, { sessionId: "cs_test_1", email: " Buyer@Example.com ", playerId: pid });
    await recordPurchase(fresh, { sessionId: "cs_test_1", email: "buyer@example.com", playerId: pid });   // the webhook and the return page both record it
    expect((await getMe(fresh, pid, TODAY)).unlocked).toBe(true);
    await getDay(fresh, pid, OLD, TODAY);
    expect(await fresh.select().from(purchases)).toHaveLength(1);

    await forgetPlayer(fresh, pid);   // deleting progress keeps the sale, so the pass can still be restored
    expect((await fresh.select().from(purchases))[0]).toMatchObject({ email: "buyer@example.com", playerId: null });
  });

  it("restores a pass on another browser with a one-use emailed link", async () => {
    const fresh = await createDb(); await seedSamples(fresh, TODAY);
    await recordPurchase(fresh, { sessionId: "cs_test_2", email: "buyer@example.com", playerId: null });
    const sent: string[] = [], send = async (_to: string, token: string) => { sent.push(token); };
    await requestRestore(fresh, "someone@else.com", send);   // didn't buy: no email, and no hint either way
    await requestRestore(fresh, "BUYER@example.com", send);
    await requestRestore(fresh, "buyer@example.com", send);   // a second ask straight away doesn't send another
    expect(sent).toHaveLength(1);
    await expect(requestRestore(fresh, "not an email", send)).rejects.toMatchObject({ status: 400 });

    const other = await ensurePlayer(fresh, undefined);
    expect(await redeemRestore(fresh, sent[0], other)).toBe(true);
    expect((await getMe(fresh, other, TODAY)).unlocked).toBe(true);
    expect(await redeemRestore(fresh, sent[0], other)).toBe(false);   // used up

    const late = Date.now() + 31 * 60_000, more: string[] = [];
    await requestRestore(fresh, "buyer@example.com", async (_t, k) => { more.push(k); });
    expect(await redeemRestore(fresh, more[0], other, late)).toBe(false);   // expired
  });
});
