// Drives the service against an in-memory Postgres: the same SQL the hosted database runs.
import { beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/db";
import seedDays from "@/content/itineraries.json";
import { act, createLeague, ensurePlayer, getDay, getMe, HttpError, joinLeague, myLeagues, seedSamples, setName } from "./service";
import { addDays } from "@/lib/game/streak";
import { itineraries } from "@/db/schema";
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
  it("pick up edits to the sample file, and never touch a real flight", async () => {
    const fresh = await createDb(), pid = await ensurePlayer(fresh, undefined), sample = (seedDays as { offset: number; rounds: Round[] }[]).find(d => d.offset === 0)!;
    const stale = sample.rounds.map(r => ({ ...r, fact: "old copy" })), real = sample.rounds.map(r => ({ ...r, prompt: `${r.prompt} (real)` }));
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
    await fresh.insert(itineraries).values([{ date: TODAY, flight: "004", rounds: old }, { date: played, flight: "003", rounds: old }]);
    await act(fresh, pid, played, 0, { type: "start" }, TODAY);
    await seedSamples(fresh, TODAY);
    const rows = Object.fromEntries((await fresh.select().from(itineraries)).map(r => [r.date, r.rounds as Round[]]));
    expect(rows[TODAY]).toEqual(sample.rounds);
    expect(rows[played]).toEqual(old);
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
    expect(day.stops.every(s => s.reveal === null && s.cities.length === 0)).toBe(true);   // the city list would name the country
    const t0 = Date.now(), t = t0 + PREVIEW_MS;
    expect((await act(db, pid, TODAY, 0, { type: "start" }, TODAY, t0)).stop.cities).toEqual([]);
    expect((await act(db, pid, TODAY, 0, { type: "guess", text: "Spain" }, TODAY, t)).stop.cities).toEqual([]);
    expect((await act(db, pid, TODAY, 0, { type: "guess", text: rounds[0].country }, TODAY, t)).stop.cities).toContain(rounds[0].cityName);
    expect((await getDay(db, pid, TODAY, TODAY)).stops[0].cities).toContain(rounds[0].cityName);   // and it survives a reload
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
