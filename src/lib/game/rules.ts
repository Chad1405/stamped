// The game's fixed rules: tiers, score bands, timings. Shared by server and client.
export const ROUNDS_PER_DAY = 5;
export const MAX_DAY_SCORE = 500;
export const PREVIEW_MS = 3000;
export const ROUND_MS = 30000;
/** Extra time the server allows past a deadline for network latency. */
export const GRACE_MS = 3000;

export type TierId = "native" | "local" | "traveller" | "backpacker" | "lost" | "tourist" | "miss";
export const TIERS: Record<TierId, { name: string; score: number; emoji: string; blurb: string }> = {
  native:     { name: "Born There",    score: 100, emoji: "📍", blurb: "Named the exact spot. Locals ask you for directions." },
  local:      { name: "Local",         score: 85,  emoji: "🏙️", blurb: "Right city. You know where the good coffee is." },
  traveller:  { name: "Traveller",     score: 60,  emoji: "🗺️", blurb: "Right region. You left the capital at least once." },
  backpacker: { name: "Backpacker",    score: 30,  emoji: "🏳️", blurb: "Right country. Passport stamped." },
  lost:       { name: "Lost Luggage",  score: 15,  emoji: "🧳", blurb: "Went deeper and got lost. Half a stamp." },
  tourist:    { name: "Tourist",       score: 10,  emoji: "🌍", blurb: "Right continent. You've seen the brochure." },
  miss:       { name: "Missed Flight", score: 0,   emoji: "⬛", blurb: "Wrong continent entirely." },
};
export const LADDER: TierId[] = ["native", "local", "traveller", "backpacker", "lost", "tourist"];
export const SCORE_BANDS = [
  { min: 0,   name: "Armchair traveller",   verdict: "You've seen the world through a screen. Plenty of runway left." },
  { min: 121, name: "Weekend tripper",      verdict: "A few good trips in the bag." },
  { min: 221, name: "Seasoned traveller",   verdict: "You've left the tourist trail more than once." },
  { min: 321, name: "Globetrotter",         verdict: "Customs officers recognise you." },
  { min: 421, name: "Citizen of the world", verdict: "You don't visit places. You go back to them." },
];
export const band = (s: number) => [...SCORE_BANDS].reverse().find(b => s >= b.min)!;

export const CONT: Record<string, string> = { AF: "Africa", AS: "Asia", EU: "Europe", NA: "North America", SA: "South America", OC: "Oceania" };
export const CONT3: Record<string, string> = { AF: "AFR", AS: "ASI", EU: "EUR", NA: "NAM", SA: "SAM", OC: "OCE" };

/** Tiers that count as naming the country, the city, or the exact spot. */
export const NAMED_COUNTRY: TierId[] = ["backpacker", "lost", "traveller", "local", "native"];
export const NAMED_CITY: TierId[] = ["local", "native"];

export const CLASSES = [
  { min: 0, name: "Economy" }, { min: 5, name: "Premium economy" }, { min: 12, name: "Business" }, { min: 25, name: "First" }, { min: 50, name: "Diplomatic" },
];
export const classFor = (n: number) => [...CLASSES].reverse().find(c => n >= c.min)!;
export const nextClass = (n: number) => CLASSES.find(c => c.min > n);
export const MILESTONES = [3, 7, 14, 30, 50, 100];

/** Great-circle distance in km between two answer cities, rounded to the nearest 10 km (the coordinates are city centres). */
export function kmBetween(a: { lat?: number; lng?: number }, b: { lat?: number; lng?: number }): number | null {
  if (a.lat === undefined || a.lng === undefined || b.lat === undefined || b.lng === undefined) return null;
  const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) / 10) * 10;
}
/** A leg counts towards your kilometres flown only if you named the city you flew to. */
export const legFlown = (tier: TierId | null | undefined) => !!tier && NAMED_CITY.includes(tier);
