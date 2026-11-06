// Turning what a player typed into a known place: aliases, accents and one-or-two-letter typos.
import countryData from "@/content/countries.json";

export type Country = { name: string; aliases: string[]; cont: string[] };
export type Entry = { id: string; name: string; aliases: string[] };
export type MatchResult = { e: Entry; near: boolean } | null;

// Letters NFD cannot split into base + accent are mapped by hand, or "Wrocław" would never match "wroclaw".
export const norm = (s: string) =>
  s.replace(/ð/gi, "d").replace(/þ/gi, "th").replace(/æ/gi, "ae").replace(/ł/gi, "l").replace(/ø/gi, "o").replace(/ħ/gi, "h")
    .replace(/đ/gi, "d").replace(/ß/g, "ss").replace(/œ/gi, "oe").replace(/ı/g, "i")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().replace(/^the /, "");

export const COUNTRIES: (Country & Entry)[] = (countryData as Country[]).map(c => ({
  ...c, id: c.name, aliases: [norm(c.name), ...c.aliases.map(norm)],
}));
export const countryByName = (name: string) => COUNTRIES.find(c => c.name === name);

/** Optimal string alignment distance: a swapped pair of letters counts as one typo. */
export function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}

export function match(text: string, entries: Entry[], strip?: RegExp): MatchResult {
  let q = norm(text);
  if (strip) q = q.replace(strip, "");
  if (!q) return null;
  for (const e of entries) if (e.aliases.includes(q)) return { e, near: false };
  if (q.length < 4) return null;
  let best: { e: Entry; d: number } | null = null;
  for (const e of entries) for (const a of e.aliases) {
    const d = lev(q, a), max = q.length >= 9 ? 2 : 1;
    if (d <= max && (!best || d < best.d)) best = { e, d };
  }
  return best ? { e: best.e, near: true } : null;
}

const CONTINENT_WORDS = ["africa", "asia", "europe", "north america", "south america", "oceania", "america", "antarctica", "australasia"];
export const isContinent = (text: string) => CONTINENT_WORDS.includes(norm(text));
