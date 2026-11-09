// One stop's state machine. Pure: (round, state, action, now) -> (state, event). The server stores the state,
// so the deadline and the answers never depend on the browser.
import { COUNTRIES, countryByName, isContinent, match, norm, type Entry } from "./match";
import { CONT, COUNTRY_MS, COUNTRY_TRIES, GRACE_MS, NAMED_COUNTRY, PREVIEW_MS, ROUND_MS, TIERS, TRY_COST, kmBetween, type TierId } from "./rules";
import capitalsData from "@/content/capitals.json";

const CAPITALS = capitalsData as unknown as Record<string, [string, number, number]>;   // a guessed country is measured from its capital

export type Round = {
  type: string; prompt: string; img?: string; alt?: string; postcard?: { text: string; note: string; lang?: string; from?: string };   // from: the sender's number, masked past its country and area code
  country: string; regionName: string; region: string[]; cityName: string; city: string[];
  spotLabel: string; spotWord: string; spotName: string; spot: string[]; spotStrip?: string;   // spotLabel: the question; spotWord: what it asks for, for the ladder and buttons
  lat?: number; lng?: number;   // the answer city, for the distance flown between stops (sent only once a stop is played)
  airport: string; fact: string; crowd: number[];
  credit?: { title: string; author: string; license: string; url: string };
};
export type Step = "country" | "city" | "spot";
export type StopState = {
  phase: "ready" | "input" | "decide" | "done";
  step: Step; banked: TierId | null; next: Step | null; guesses: string[];
  misses?: number;   // wrong tries at the country; they are guesses[0 .. misses-1]. Optional: stops saved before tries existed have none
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
  | { kind: "wrong"; name: string; triesLeft: number }
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
    if (s.guesses.includes(m.e.name) && !forced) return { state: s, event: { kind: "rejected", message: `You already tried ${m.e.name}. Use the clue and pick another.` } };
    const guesses = [...s.guesses, m.e.name];
    if (m.e.name === r.country) return { state: { ...s, guesses, phase: "decide", banked: "backpacker", next: "city", endsAt: null }, event: { kind: "right", name: m.e.name } };
    const misses = (s.misses ?? 0) + 1, triesLeft = COUNTRY_TRIES - misses;
    if (triesLeft > 0 && !forced) return { state: { ...s, guesses, misses }, event: { kind: "wrong", name: m.e.name, triesLeft } };   // the clock keeps running
    return outOfTries(r, { ...s, guesses, misses });
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
  if (m) return finish({ ...s, guesses }, "native", "You got all three.");
  return finish({ ...s, guesses }, "traveller", `"${text}" was not it. You dropped one tier.`);
}

export function applyAction(r: Round, s: StopState, a: Action, now: number): { state: StopState; event: Event } {
  if (s.phase === "done") return { state: s, event: { kind: "ignored" } };
  if (a.type === "start") {
    if (s.phase !== "ready") return { state: s, event: { kind: "ignored" } };
    return { state: { ...s, phase: "input", endsAt: now + PREVIEW_MS + COUNTRY_MS }, event: { kind: "started" } };
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
  if (s.step === "country") return s.misses ? outOfTries(r, s) : finish(s, "miss", "Time ran out before you named a country.");
  return finish(s, s.banked!, "Time ran out. You kept what you had banked.");
}

/** No more tries at the country: any guess on the right continent still earns the Tourist stamp. */
function outOfTries(r: Round, s: StopState) {
  const target = countryByName(r.country)!;
  const close = s.guesses.some(g => countryByName(g)?.cont.some(c => target.cont.includes(c)));
  return finish(s, close ? "tourist" : "miss", close ? "Right continent. The Tourist stamp is yours." : "Not this time. Now you know it.");
}

const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
const ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
/** Which way to head from a guessed capital to the answer, as it looks on a flat map (a rhumb line), to the nearest of eight points.
 *  The true great-circle heading says Madrid to Reykjavík is "north"; on the map everyone pictures, it is north-west. */
function heading(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const rad = Math.PI / 180, merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + lat * rad / 2));
  let dLng = (to.lng - from.lng) * rad;
  if (Math.abs(dLng) > Math.PI) dLng -= Math.sign(dLng) * 2 * Math.PI;   // the short way round, across the date line if need be
  const k = Math.round(((Math.atan2(dLng, merc(to.lat) - merc(from.lat)) / rad + 360) % 360) / 45) % 8;
  return { dir: COMPASS[k], arrow: ARROWS[k] };
}

/** The clues a wrong country earns: how far off and which way, then the continent after the second miss.
 *  Only while the country is still being guessed, so a finished stop does not repeat them. */
export function countryClues(r: Round, s: StopState) {
  const misses = s.misses ?? 0;
  if (s.step !== "country" || s.phase !== "input" || !misses) return null;
  const tries = s.guesses.slice(0, misses).map(name => {
    const cap = CAPITALS[name], at = cap && { lat: cap[1], lng: cap[2] };
    const km = at ? kmBetween(at, r) : null;
    return { name, capital: cap?.[0] ?? null, km, ...(at && r.lat !== undefined && r.lng !== undefined && km ? heading(at, { lat: r.lat, lng: r.lng }) : { dir: null, arrow: null }) };
  });
  return { tries, triesLeft: COUNTRY_TRIES - misses, continent: misses >= 2 ? CONT[countryByName(r.country)!.cont[0]] : null };
}

/** A stop's points: the tier, less a little for each extra try at the country, never below a Tourist stamp's worth. */
export function stopPoints(s: Pick<StopState, "tier" | "misses">) {
  if (!s.tier) return 0;
  const base = TIERS[s.tier].score;
  return NAMED_COUNTRY.includes(s.tier) ? Math.max(TIERS.tourist.score, base - TRY_COST * (s.misses ?? 0)) : base;
}
