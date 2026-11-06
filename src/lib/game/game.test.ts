import { describe, expect, it } from "vitest";
import days from "@/content/itineraries.json";
import citiesData from "@/content/cities.json";
import { applyAction, freshStop, type Round, type StopState } from "./engine";
import { COUNTRIES, match, norm } from "./match";
import { GRACE_MS, PREVIEW_MS, ROUND_MS } from "./rules";
import { addDays, streakInfo, weekOf } from "./streak";

const rounds = (days as { rounds: Round[] }[]).flatMap(d => d.rounds);
const T0 = 1_000_000;
const play = (r: Round, moves: { t: number; a: Parameters<typeof applyAction>[2] }[]) =>
  moves.reduce<{ state: StopState; events: string[] }>((acc, m) => { const o = applyAction(r, acc.state, m.a, m.t); return { state: o.state, events: [...acc.events, o.event.kind] }; }, { state: freshStop(), events: [] });

describe("matching", () => {
  it("handles aliases, accents and letters NFD cannot split", () => {
    expect(match("England", COUNTRIES)?.e.name).toBe("United Kingdom");
    expect(match("Côte d’Ivoire", COUNTRIES)?.e.name).toBe("Ivory Coast");
    expect(norm("Wrocław")).toBe("wroclaw");
    expect(norm("Tromsø")).toBe("tromso");
  });
  it("offers a correction for a swapped pair of letters, never for a short word", () => {
    expect(match("Chlie", COUNTRIES)).toEqual(expect.objectContaining({ near: true }));
    expect(match("Chad", COUNTRIES)?.near).toBe(false);
    expect(match("Atlantis", COUNTRIES)).toBeNull();
  });
  it("every city in every dropdown survives normalising", () => {
    for (const list of Object.values(citiesData as Record<string, string[]>)) for (const c of list) expect(norm(c)).toMatch(/^[a-z0-9 ]+$/);
  });
});

describe("the stop engine", () => {
  it("every stop of every day can be played perfectly", () => {
    for (const r of rounds) {
      const t = T0 + PREVIEW_MS;
      const { state } = play(r, [{ t: T0, a: { type: "start" } }, { t, a: { type: "guess", text: r.country } }, { t, a: { type: "decide", deeper: true } },
        { t, a: { type: "guess", text: r.cityName } }, { t, a: { type: "decide", deeper: true } }, { t, a: { type: "guess", text: r.spot[0] } }]);
      expect(state.tier, `${r.cityName}`).toBe("native");
    }
  });
  it("bank, lost luggage, tourist and miss", () => {
    const r = rounds.find(x => x.country === "Chile")!, t = T0 + 5000;
    expect(play(r, [{ t: T0, a: { type: "start" } }, { t, a: { type: "guess", text: "Chile" } }, { t, a: { type: "decide", deeper: false } }]).state.tier).toBe("backpacker");
    expect(play(r, [{ t: T0, a: { type: "start" } }, { t, a: { type: "guess", text: "Chile" } }, { t, a: { type: "decide", deeper: true } }, { t, a: { type: "guess", text: "Santiago" } }]).state.tier).toBe("lost");
    expect(play(r, [{ t: T0, a: { type: "start" } }, { t, a: { type: "guess", text: "Peru" } }]).state.tier).toBe("tourist");
    expect(play(r, [{ t: T0, a: { type: "start" } }, { t, a: { type: "guess", text: "Japan" } }]).state.tier).toBe("miss");
  });
  it("a correction or unknown word costs nothing", () => {
    const r = rounds.find(x => x.country === "Chile")!;
    const o = play(r, [{ t: T0, a: { type: "start" } }, { t: T0 + 4000, a: { type: "guess", text: "Chlie" } }, { t: T0 + 4000, a: { type: "guess", text: "Atlantis" } }]);
    expect(o.events).toEqual(["started", "correction", "rejected"]);
    expect(o.state.phase).toBe("input");
  });
  it("the server clock wins: a late guess is a timeout, an early timeout is ignored", () => {
    const r = rounds.find(x => x.country === "Chile")!, deadline = T0 + PREVIEW_MS + ROUND_MS;
    expect(play(r, [{ t: T0, a: { type: "start" } }, { t: T0 + 5000, a: { type: "timeout" } }]).events[1]).toBe("ignored");
    expect(play(r, [{ t: T0, a: { type: "start" } }, { t: deadline + GRACE_MS + 1, a: { type: "guess", text: "Chlie" } }]).state.phase).toBe("decide");   // forced: near-match accepted
    expect(play(r, [{ t: T0, a: { type: "start" } }, { t: deadline, a: { type: "timeout" } }]).state.tier).toBe("miss");
  });
  it("the clock stops while deciding and restarts for the city", () => {
    const r = rounds.find(x => x.country === "Chile")!;
    const o = play(r, [{ t: T0, a: { type: "start" } }, { t: T0 + 20000, a: { type: "guess", text: "Chile" } }]);
    expect(o.state.endsAt).toBeNull();
    const later = applyAction(r, o.state, { type: "decide", deeper: true }, T0 + 120000);
    expect(later.state.endsAt).toBe(T0 + 120000 + ROUND_MS);
  });
});

describe("streaks and the lounge pass", () => {
  const today = "2026-11-05";   // a Thursday
  const days = (...offs: number[]) => new Set(offs.map(o => addDays(today, -o)));
  it("an unflown today keeps yesterday's streak alive", () => {
    expect(streakInfo(days(1, 2, 3), [], today)).toEqual(expect.objectContaining({ n: 3, playedToday: false }));
  });
  it("one missed day is covered, and the pass is only spent once today is flown", () => {
    const before = streakInfo(days(1, 3, 4), [], today);
    expect(before).toEqual(expect.objectContaining({ n: 3, pending: addDays(today, -2), spend: null }));
    const after = streakInfo(days(0, 1, 3, 4), [], today);
    expect(after).toEqual(expect.objectContaining({ n: 4, spend: addDays(today, -2), milestone: null }));
  });
  it("a second miss in the same week breaks it", () => {
    expect(streakInfo(days(0, 2, 4, 5), [], today).n).toBe(2);
  });
  it("milestones and the Monday week", () => {
    expect(streakInfo(days(0, 1, 2, 3, 4, 5, 6), [], today).milestone).toBe(7);
    expect(weekOf(today)).toBe("2026-11-02");
  });
});
