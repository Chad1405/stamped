// One stop's state machine. Pure: (round, state, action, now) -> (state, event). The server stores the state,
// so the deadline and the answers never depend on the browser.
import { COUNTRIES, countryByName, isContinent, match, norm, type Entry } from "./match";
import { GRACE_MS, PREVIEW_MS, ROUND_MS, type TierId } from "./rules";

export type Round = {
  type: string; prompt: string; img?: string; alt?: string; postcard?: { text: string; note: string; lang?: string };
  country: string; regionName: string; region: string[]; cityName: string; city: string[];
  spotLabel: string; spotName: string; spot: string[]; spotStrip?: string;
  airport: string; fact: string; crowd: number[];
  credit?: { title: string; author: string; license: string; url: string };
};
export type Step = "country" | "city" | "spot";
export type StopState = {
  phase: "ready" | "input" | "decide" | "done";
  step: Step; banked: TierId | null; next: Step | null; guesses: string[];
  endsAt: number | null; tier: TierId | null; note: string | null;
};
export type Action =
  | { type: "start" }
  | { type: "guess"; text: string }
  | { type: "decide"; deeper: boolean }
  | { type: "timeout"; text?: string };
export type Event =
  | { kind: "started" | "advanced" | "ignored" }
  | { kind: "correction"; suggestion: string }
  | { kind: "rejected"; message: string }
  | { kind: "right"; name: string }
  | { kind: "finished"; tier: TierId; note: string };

export const freshStop = (): StopState => ({ phase: "ready", step: "country", banked: null, next: null, guesses: [], endsAt: null, tier: null, note: null });

const finish = (s: StopState, tier: TierId, note: string) => ({ state: { ...s, phase: "done" as const, tier, note, endsAt: null }, event: { kind: "finished" as const, tier, note } });

function submit(r: Round, s: StopState, text: string, forced: boolean): { state: StopState; event: Event } {
  if (s.step === "country") {
    const m = match(text, COUNTRIES);
    if (!m) {
      if (forced) return finish(s, "miss", `"${text}" is not a country we know.`);
      return { state: s, event: { kind: "rejected", message: isContinent(text) ? "That is a continent. Name a country." : `"${text}" is not on our map. Try again.` } };
    }
    if (m.near && !forced) return { state: s, event: { kind: "correction", suggestion: m.e.name } };
    const guesses = [...s.guesses, m.e.name];
    if (m.e.name === r.country) return { state: { ...s, guesses, phase: "decide", banked: "backpacker", next: "city", endsAt: null }, event: { kind: "right", name: m.e.name } };
    const target = countryByName(r.country)!, said = countryByName(m.e.name)!;
    return finish({ ...s, guesses }, said.cont.some(c => target.cont.includes(c)) ? "tourist" : "miss", `You said ${m.e.name}.`);
  }
  if (s.step === "city") {
    const entries: Entry[] = [{ id: "city", name: r.cityName, aliases: r.city.map(norm) }, { id: "region", name: r.regionName, aliases: r.region.map(norm) }];
    const m = match(text, entries);
    if (m && m.near && !forced) return { state: s, event: { kind: "correction", suggestion: m.e.name } };
    const guesses = [...s.guesses, m ? m.e.name : text];
    if (m?.e.id === "city") return { state: { ...s, guesses, phase: "decide", banked: "local", next: "spot", endsAt: null }, event: { kind: "right", name: m.e.name } };
    if (m?.e.id === "region") return finish({ ...s, guesses }, "traveller", "Right region, but not the city.");
    return finish({ ...s, guesses }, "lost", `"${text}" was not it. You dropped to half a stamp.`);
  }
  // spot: near-misses count, because suggesting a correction would hand over the answer
  const m = match(text, [{ id: "spot", name: r.spotName, aliases: r.spot.map(norm) }], r.spotStrip ? new RegExp(r.spotStrip) : undefined);
  const guesses = [...s.guesses, text];
  if (m) return finish({ ...s, guesses }, "native", "You named the exact spot.");
  return finish({ ...s, guesses }, "traveller", `"${text}" was not it. You dropped one tier.`);
}

export function applyAction(r: Round, s: StopState, a: Action, now: number): { state: StopState; event: Event } {
  if (s.phase === "done") return { state: s, event: { kind: "ignored" } };
  if (a.type === "start") {
    if (s.phase !== "ready") return { state: s, event: { kind: "ignored" } };
    return { state: { ...s, phase: "input", endsAt: now + PREVIEW_MS + ROUND_MS }, event: { kind: "started" } };
  }
  if (a.type === "decide") {
    if (s.phase !== "decide" || !s.next || !s.banked) return { state: s, event: { kind: "ignored" } };
    if (!a.deeper) return finish(s, s.banked, "Stamp banked.");
    return { state: { ...s, phase: "input", step: s.next, next: null, endsAt: now + ROUND_MS }, event: { kind: "advanced" } };   // every guess gets its own clock
  }
  if (s.phase !== "input" || s.endsAt === null) return { state: s, event: { kind: "ignored" } };
  const late = now > s.endsAt + GRACE_MS;
  if (a.type === "guess") {
    const text = a.text.trim().slice(0, 80);
    if (!text) return { state: s, event: { kind: "ignored" } };
    if (late) return timeUp(r, s, text);
    return submit(r, s, text, false);
  }
  // timeout: only honoured once the clock has really run out
  if (now < s.endsAt - GRACE_MS) return { state: s, event: { kind: "ignored" } };
  return timeUp(r, s, a.text?.trim().slice(0, 80));
}

function timeUp(r: Round, s: StopState, draft?: string) {
  if (draft) return submit(r, s, draft, true);   // whatever was typed counts when the clock runs out
  if (s.step === "country") return finish(s, "miss", "Time ran out before you named a country.");
  return finish(s, s.banked!, "Time ran out. You kept what you had banked.");
}
