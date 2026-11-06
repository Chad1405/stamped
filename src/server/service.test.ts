// Drives the service against an in-memory Postgres: the same SQL the hosted database runs.
import { beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/db";
import seedDays from "@/content/itineraries.json";
import { act, createLeague, ensurePlayer, getDay, getMe, HttpError, joinLeague, myLeagues, seedSamples, setName } from "./service";
import { addDays } from "@/lib/game/streak";
import { PREVIEW_MS } from "@/lib/game/rules";

const TODAY = "2026-11-05";
const rounds = (seedDays as { offset: number; rounds: { country: string; cityName: string; spot: string[] }[] }[]).find(d => d.offset === 0)!.rounds;
let db: Db;
beforeAll(async () => { db = await createDb(); await seedSamples(db, TODAY); });

describe("sample flights", () => {
  it("rotate so every new day has a flight, without touching earlier ones", async () => {
    const fresh = await createDb(), next = addDays(TODAY, 1), pid = await ensurePlayer(fresh, undefined);
    await seedSamples(fresh, TODAY);
    expect((await getDay(fresh, pid, TODAY, TODAY)).flight).toBe("004");
    await seedSamples(fresh, next); await seedSamples(fresh, next);   // a second call the same day adds nothing
    const tomorrow = await getDay(fresh, pid, next, next), oldest = (seedDays as { offset: number; rounds: { prompt: string }[] }[]).find(d => d.offset === -3)!;
    expect(tomorrow.flight).toBe("005");
    expect(tomorrow.stops[0].prompt).toBe(oldest.rounds[0].prompt);
    expect((await getDay(fresh, pid, TODAY, next)).flight).toBe("004");
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
  it("never sends an answer before its stop is finished", async () => {
    const pid = await ensurePlayer(db, undefined);
    const day = await getDay(db, pid, TODAY, TODAY);
    const text = JSON.stringify(day);
    for (const r of rounds) { expect(text).not.toContain(`"${r.country}"`); expect(text).not.toContain(r.spot[0]); }
    expect(day.stops.every(s => s.reveal === null)).toBe(true);
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
    expect(day.stops[0].reveal).toEqual(expect.objectContaining({ cityName: "Valparaíso", code: "SCL" }));
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
