import { describe, expect, it } from "vitest";
import days from "@/content/itineraries.json";
import citiesData from "@/content/cities.json";
import { applyAction, countryClues, freshStop, stopPoints, type Round, type StopState } from "./engine";
import { COUNTRIES, match, norm } from "./match";
import { COUNTRY_MS, GRACE_MS, kmBetween, legFlown, PREVIEW_MS, ROUND_MS } from "./rules";
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
    const tries = (...names: string[]) => play(r, [{ t: T0, a: { type: "start" } }, ...names.map(text => ({ t, a: { type: "guess" as const, text } }))]);
    expect(tries("Peru", "Bolivia", "Ecuador").state.tier).toBe("tourist");   // three misses, on the right continent
    expect(tries("Japan", "China", "India").state.tier).toBe("miss");
  });
  it("a correction or unknown word costs nothing", () => {
    const r = rounds.find(x => x.country === "Chile")!;
    const o = play(r, [{ t: T0, a: { type: "start" } }, { t: T0 + 4000, a: { type: "guess", text: "Chlie" } }, { t: T0 + 4000, a: { type: "guess", text: "Atlantis" } }]);
    expect(o.events).toEqual(["started", "correction", "rejected"]);
    expect(o.state.phase).toBe("input");
  });
  it("the server clock wins: a late guess is a timeout, an early timeout is ignored", () => {
    const r = rounds.find(x => x.country === "Chile")!, deadline = T0 + PREVIEW_MS + COUNTRY_MS;
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

describe("three tries at the country", () => {
  const r = rounds.find(x => x.country === "Chile")!, t = T0 + 5000;
  const go = (...names: string[]) => play(r, [{ t: T0, a: { type: "start" } }, ...names.map(text => ({ t, a: { type: "guess" as const, text } }))]);
  it("a miss earns a clue and another try; the third miss ends the stop", () => {
    const one = go("Spain");
    expect(one.events.at(-1)).toBe("wrong");
    expect(one.state.phase).toBe("input");
    const c = countryClues(r, one.state)!;
    expect(c.tries[0]).toEqual(expect.objectContaining({ name: "Spain", capital: "Madrid", dir: "south-west", arrow: "↙" }));
    expect(c.tries[0].km! > 10_000).toBe(true);
    expect(c.continent).toBeNull();
    expect(countryClues(r, go("Spain", "Mexico").state)!.continent).toBe("South America");   // after the second miss
    expect(go("Spain", "Mexico", "Japan").state.phase).toBe("done");
    expect(countryClues(r, go("Spain", "Mexico", "Japan").state)).toBeNull();
  });
  it("trying the same country twice costs nothing", () => {
    const o = go("Spain", "Spain");
    expect(o.events.slice(-2)).toEqual(["wrong", "rejected"]);
    expect(o.state.misses).toBe(1);
  });
  it("each extra try takes 10 off, never below 10; you can still go deeper", () => {
    const two = go("Peru", "Chile");
    expect(two.state.phase).toBe("decide");
    expect(stopPoints({ tier: "backpacker", misses: 1 })).toBe(20);
    expect(stopPoints({ tier: "local", misses: 2 })).toBe(65);
    expect(stopPoints({ tier: "lost", misses: 2 })).toBe(10);
    expect(stopPoints({ tier: "tourist", misses: 2 })).toBe(10);
    expect(stopPoints({ tier: "native" })).toBe(100);   // stops saved before tries existed
  });
  it("the clock runs out after a miss: the Tourist stamp if a try was on the right continent", () => {
    const deadline = T0 + PREVIEW_MS + COUNTRY_MS;
    const o = play(r, [{ t: T0, a: { type: "start" } }, { t, a: { type: "guess", text: "Peru" } }, { t: deadline, a: { type: "timeout" } }]);
    expect(o.state.tier).toBe("tourist");
  });
  it("every sample day runs from the most-named country to the least", () => {
    for (const d of days as { offset: number; rounds: Round[] }[]) {
      const named = d.rounds.map(x => x.crowd[0]);
      expect(named, `day ${d.offset}`).toEqual(named.toSorted((a, b) => b - a));
      expect(named[0] >= 60, `day ${d.offset} should open with a stop most players get`).toBe(true);
    }
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

describe("kilometres flown", () => {
  it("measures great-circle distance, rounded to 10 km", () => {
    expect(kmBetween({ lat: 51.5074, lng: -0.1278 }, { lat: 48.8566, lng: 2.3522 })).toBe(340);   // London to Paris, about 344 km
    expect(kmBetween({ lat: 1, lng: 1 }, { lat: undefined, lng: 2 })).toBeNull();
  });
  it("counts a leg only when you name the city it lands in", () => {
    expect(["native", "local"].every(t => legFlown(t as never))).toBe(true);
    expect(["traveller", "backpacker", "lost", "tourist", "miss"].some(t => legFlown(t as never))).toBe(false);
  });
  it("every sample stop has coordinates, and every leg is a real flight", () => {
    for (const d of days as { rounds: Round[] }[]) d.rounds.forEach((r, i) => {
      expect(typeof r.lat === "number" && typeof r.lng === "number", r.cityName).toBe(true);
      if (i) { const km = kmBetween(d.rounds[i - 1], r)!; expect(km > 50 && km < 20_040, `${d.rounds[i - 1].cityName} to ${r.cityName}: ${km}`).toBe(true); }
    });
  });
});

describe("how close a wrong guess was", () => {
  it("every country has a capital with real coordinates", async () => {
    const caps = (await import("@/content/capitals.json")).default as unknown as Record<string, [string, number, number]>;
    for (const c of COUNTRIES) {
      const cap = caps[c.name];
      expect(cap, c.name).toBeDefined();
      expect(Math.abs(cap[1]) <= 90 && Math.abs(cap[2]) <= 180, c.name).toBe(true);
    }
    expect(kmBetween({ lat: caps.Spain[1], lng: caps.Spain[2] }, { lat: caps.Portugal[1], lng: caps.Portugal[2] })).toBe(500);   // Madrid to Lisbon, about 503 km
  });
});
