// Fills the review queue without anyone typing JSON: Claude picks places, then writes each stop from its Wikipedia article
// and chooses among real Commons photos. Everything still goes through addDrafts' checks, and a person approves every stop.
import Anthropic from "@anthropic-ai/sdk";
import { and, eq, gte, isNull, ne } from "drizzle-orm";
import type { Db } from "@/db";
import { itineraries, stopBank } from "@/db/schema";
import { COUNTRIES, countryByName, norm } from "@/lib/game/match";
import { STOP_TYPES } from "@/lib/game/rules";
import { addDrafts, commonsPhoto, creditFromCommons, wikimedia, type CommonsInfo, type Draft } from "./bank";
import { SAMPLES } from "./service";
import type { Round } from "@/lib/game/engine";
import { SITE } from "@/lib/site";

const MODEL = "claude-opus-5-5";
const STOCK_DAYS = 21;          // stops of each type waiting (in review or approved, not yet used) before the job stops drafting more
const PER_RUN = 7, SPARE = 2;   // a week of each type per run, plus a couple the checks or the reviewer may throw out
const PHOTOS = 4;               // candidate photos Claude chooses between

/** How many stops of each type to draft now. */
export async function needed(db: Db): Promise<Record<string, number>> {
  const stock = await db.select({ round: stopBank.round }).from(stopBank).where(and(ne(stopBank.status, "rejected"), isNull(stopBank.usedOn)));
  return Object.fromEntries(STOP_TYPES.map(t => [t, Math.max(0, Math.min(PER_RUN, STOCK_DAYS - stock.filter(s => s.round.type === t).length))]));
}

/* ---- talking to Claude ---- */
type Block = Anthropic.Beta.BetaContentBlockParam;
export type Ask = <T>(content: Block[], schema: Record<string, unknown>) => Promise<T>;

const SYSTEM = `You write stops for Born There, a daily geography game. Each stop shows a photo (or, for Language stops, a text message) and the player names the country, then the city, then answers a final question about the exact thing shown.
Rules for every stop:
- Facts come only from the source text you're given. Never add a fact it doesn't support.
- Nothing the player sees before guessing (the clue, the photo description, the final question) may name or hint at the country, city or answer.
- Accepted spellings are lowercase alternatives a player might type: English and local names, with and without "the", common transliterations.
- Crowd estimates are the share of players who'd get the country, the city and the final answer, falling in that order.
- Write in plain British English.`;

let client: Anthropic | undefined;
const claude: Ask = async <T>(content: Block[], schema: Record<string, unknown>) => {
  client ??= new Anthropic();
  const res = await client.beta.messages.create({
    model: MODEL, max_tokens: 16000, system: SYSTEM,
    betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",   // a stop about a stadium or a war memorial shouldn't stall the batch on a false-positive refusal
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    messages: [{ role: "user", content }],
  });
  if (res.stop_reason === "refusal") throw new Error("Claude declined to draft it");
  if (res.stop_reason === "max_tokens") throw new Error("the draft was cut off");
  const text = res.content.find(b => b.type === "text");
  if (!text) throw new Error("Claude returned no draft");
  return JSON.parse(text.text) as T;
};

const str = { type: "string" }, strs = { type: "array", items: str }, obj = (props: Record<string, object>) => ({ type: "object", properties: props, required: Object.keys(props), additionalProperties: false });
const IDEA = obj({ country: str, cityName: str, spotName: str, wikipedia: str, photoSearch: str });
const DRAFT = obj({
  usable: { type: "boolean" }, concerns: str, photo: { type: "integer" }, alt: str, prompt: str,
  cityName: str, city: strs, regionName: str, region: strs, spotLabel: str, spotWord: str, spotName: str, spot: strs,
  airport: str, fact: str, tells: str, crowd: { type: "array", items: { type: "number" } }, lat: { type: "number" }, lng: { type: "number" },
  message: str, messageLang: str, messageFrom: str, messageNote: str, translation: str,
});
type Idea = { country: string; cityName: string; spotName: string; wikipedia: string; photoSearch: string };
type Written = { usable: boolean; concerns: string; photo: number; alt: string; prompt: string; cityName: string; city: string[]; regionName: string; region: string[];
  spotLabel: string; spotWord: string; spotName: string; spot: string[]; airport: string; fact: string; tells: string; crowd: number[]; lat: number; lng: number;
  message: string; messageLang: string; messageFrom: string; messageNote: string; translation: string };

const WHAT: Record<string, string> = {
  Landmark: "a famous building, monument or structure that a photo shows clearly.",
  Food: "a dish strongly tied to one city or region, shown on a plate.",
  "Street View": "a street scene whose look (architecture, colours, landscape) hints at the place: an old quarter, a neighbourhood, a canal, a hillside. The final question names that area.",
  "Close-up": "a close detail tied to one place: little statues, balconies, tiles, doors, a wharf's houses. The final question names the detail or the place it belongs to.",
  Language: "no photo: a short text message from a local friend, written in the local language, arranging to meet at a named place (a stadium, market, square, district). Most players read only English, so the message also mentions one everyday thing a non-speaker could recognise and place: a local dish or drink, the currency, a festival, a football club. It must not name the city or the country. The final question names that place.",
};
const example = (type: string) => { const { img: _i, credit: _c, ...r } = SAMPLES.flatMap(d => d.rounds).find(r => r.type === type)!; return JSON.stringify(r); };

/** What gave the place away: shown with the answer, so a player who missed learns what to look for next time. */
const tellsRule = (type: string) => `"tells" is one or two sentences, shown with the answer, on what ${type === "Language"
  ? "in the message points to this country and city: the language, its spelling or slang, the phone number's country code, a place or currency it mentions"
  : "in the chosen photo points to this country and city: architecture, building materials, landscape and light, vehicles, clothing, how a dish is served"}. Only what is really there, in no more than 35 words, written to the player, for example "The pointed basalt-column tower and the Viking statue out front are the giveaways." Don't repeat the fact.`;

/* ---- sources ---- */
export type Get = (url: string) => Promise<Response>;
async function wikipedia(get: Get, title: string) {
  const q = new URLSearchParams({ action: "query", prop: "extracts|info", inprop: "url", explaintext: "1", redirects: "1", titles: title, format: "json", formatversion: "2" });
  const res = await get(`https://en.wikipedia.org/w/api.php?${q}`);
  if (!res.ok) throw new Error(`Wikipedia said ${res.status}`);
  const page = ((await res.json()) as { query?: { pages?: { extract?: string; fullurl?: string; missing?: boolean }[] } }).query?.pages?.[0];
  if (!page?.extract || page.missing) throw new Error(`no Wikipedia article "${title}"`);
  return { text: page.extract.slice(0, 8000), url: page.fullurl ?? "" };
}

/** Commons photos that are free to use, big enough and landscape, most relevant first. */
async function candidates(get: Get, search: string) {
  const q = new URLSearchParams({ action: "query", generator: "search", gsrnamespace: "6", gsrsearch: `${search} filetype:bitmap`, gsrlimit: "15", prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "960", format: "json", formatversion: "2" });
  const res = await get(`https://commons.wikimedia.org/w/api.php?${q}`);
  if (!res.ok) throw new Error(`Commons said ${res.status}`);
  const pages = ((await res.json()) as { query?: { pages?: { title: string; index: number; imageinfo?: (CommonsInfo & { height: number })[] }[] } }).query?.pages ?? [];
  const ok = pages.toSorted((a, b) => a.index - b.index).filter(p => {
    const info = p.imageinfo?.[0];
    if (!info?.thumburl || info.width < info.height) return false;
    try { creditFromCommons(p.title, info); return true; } catch { return false; }
  }).slice(0, PHOTOS);
  const photos = await Promise.all(ok.map(async p => {
    const img = await get(p.imageinfo![0].thumburl!);
    return img.ok ? { page: p.imageinfo![0].descriptionurl, data: Buffer.from(await img.arrayBuffer()).toString("base64") } : null;
  }));
  return photos.filter(p => p !== null);
}

/* ---- one stop ---- */
async function draftOne(type: string, idea: Idea, ask: Ask, get: Get): Promise<Draft> {
  const country = countryByName(idea.country)?.name;
  if (!country) throw new Error(`"${idea.country}" isn't a country the game knows`);
  const source = await wikipedia(get, idea.wikipedia);
  const photos = type === "Language" ? [] : await candidates(get, idea.photoSearch);
  if (type !== "Language" && !photos.length) throw new Error("no free-to-use landscape photo on Commons");
  const content: Block[] = [
    { type: "text", text: `Write a ${type} stop: ${WHAT[type]}
Place: ${idea.spotName}, ${idea.cityName}, ${country}.
Here is a finished ${type} stop to match in style and format (ignore its facts):
${example(type)}

${photos.length ? `Choose the photo (by number) that shows ${idea.spotName} clearly and contains no readable sign, caption, flag, watermark or text that gives away the place. Describe it in "alt" without naming anything. Leave the message fields empty.`
  : `Put the message in "message", in the local language, as a friend would text it; "messageLang" is its language code, "messageFrom" a phone number with the country and area code and the rest masked like the example, "messageNote" like "Text message, 19:40", and "translation" an English translation. Set "photo" to -1 and "alt" to "".`}
The final question reads "What is/are ... called?" and "spotWord" is its one- or two-word short label, each word 8 letters or fewer.
"airport" is the IATA code of the main airport serving the city; "lat" and "lng" are the city's.
The fact is one or two sentences a player would enjoy learning, taken from the source.
${tellsRule(type)}${type === "Language" ? " Start it with the message's translation in quotes, like the example." : ""}
Set "usable" to false, and say why in "concerns", if no photo works, the source doesn't support a good fact, or the stop would be unfair or confusing. Otherwise put anything the reviewer should double-check in "concerns".

Source (${source.url}):
${source.text}` },
    ...photos.flatMap((p, k): Block[] => [{ type: "text", text: `Photo ${k}:` }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data: p.data } }]),
  ];
  const w = await ask<Written>(content, DRAFT);
  if (!w.usable) throw new Error(`Claude passed on it: ${w.concerns}`);
  const photo = photos[w.photo];
  if (type !== "Language" && !photo) throw new Error("Claude didn't pick a photo");
  return {
    type, prompt: w.prompt, country, cityName: w.cityName, city: spellings(w.city), regionName: w.regionName, region: spellings(w.region),
    spotLabel: w.spotLabel, spotWord: w.spotWord, spotName: w.spotName, spot: spellings(w.spot), airport: w.airport.toUpperCase(), fact: w.fact, tells: w.tells,
    crowd: w.crowd.map(Math.round), lat: w.lat, lng: w.lng,
    ...(photo ? { alt: w.alt, photo: photo.page } : { postcard: { text: w.message, lang: w.messageLang, from: w.messageFrom, note: w.messageNote } }),
    note: ["Drafted by Claude.", w.translation && `In English: ${w.translation}`, w.concerns && `Check: ${w.concerns}`].filter(Boolean).join(" "),
    source: source.url,
  };
}

/** Accepted spellings as the game compares them, each once. */
const spellings = (xs: string[]) => [...new Set(xs.map(norm).filter(Boolean))];

async function mapLimit<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>) {
  const out: R[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (next < items.length) { const i = next++; out[i] = await fn(items[i]); } }));
  return out;
}

/* ---- the run ---- */
export type Deps = { ask?: Ask; get?: Get; getPhoto?: typeof commonsPhoto };
/** Drafts what the bank is short of, every type at once, into the review queue. */
export async function draftStops(db: Db, { ask = claude, get = wikimedia, getPhoto = commonsPhoto }: Deps = {}) {
  if (ask === claude && !process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY isn't set");
  const need = await needed(db);
  const bank = await db.select({ round: stopBank.round, status: stopBank.status, usedOn: stopBank.usedOn }).from(stopBank);
  const known = [...SAMPLES.flatMap(d => d.rounds), ...bank.map(b => b.round)];
  const waiting = [...new Set(bank.filter(b => b.status !== "rejected" && !b.usedOn).map(b => b.round.country))].join(", ");
  const types = STOP_TYPES.filter(t => need[t] > 0);
  if (!types.length) return { added: 0, skipped: [], need };
  // one request picks places for every type, so it can spread them; the code still keeps a city to one stop per run
  const picked = await ask<Record<string, Idea[]>>([{ type: "text", text: `Suggest places for this week's stops:
${types.map(t => `- ${t}: ${need[t] + SPARE} places. ${WHAT[t]} Don't repeat any of these: ${known.filter(r => r.type === t).map(r => `${r.spotName} (${r.country})`).join("; ") || "none"}.`).join("\n")}
Every place must be in a different city, and use as many different countries as you can, spread across continents. Favour countries other than these, which already have stops waiting: ${waiting || "none yet"}.
For each type, mix them: about half that most players would recognise, the rest harder but fair.
"country" must be written exactly as in this list: ${COUNTRIES.map(c => c.name).join(", ")}.
"wikipedia" is the exact title of the English Wikipedia article about the spot (or the dish, or for Language stops the meeting place). "photoSearch" is a short Wikimedia Commons search that finds photos of it (leave it empty for Language).` }],
    obj(Object.fromEntries(types.map(t => [t, { type: "array", items: IDEA }]))));
  const cities = new Set<string>(), skipped: string[] = [];
  const plan = types.map(type => ({ type, ideas: (picked[type] ?? []).filter(idea => {
    const city = `${norm(idea.country)}|${norm(idea.cityName)}`;
    if (cities.has(city)) { skipped.push(`${idea.spotName}: ${idea.cityName} already has a stop in this run`); return false; }
    cities.add(city); return true;
  }) }));
  const runs = await Promise.all(plan.map(async ({ type, ideas }) => {
    let added = 0;
    await mapLimit(ideas, 3, async idea => {   // each stop is saved as soon as it's drafted, so a run cut off by the time limit keeps what it paid for
      try { const res = await addDrafts(db, [await draftOne(type, idea, ask, get)], getPhoto); added += res.added; skipped.push(...res.skipped); }
      catch (e) { skipped.push(`${idea.spotName}: ${e instanceof Error ? e.message : e}`); }
    });
    return added;
  }));
  return { added: runs.reduce((n, r) => n + r, 0), skipped, need };
}

/* ---- what gave it away, for stops written before the line existed ---- */
const TELLS = obj({ tells: str });
async function tellsFor(r: Round, ask: Ask, get: Get) {
  const content: Block[] = [{ type: "text", text: `A ${r.type} stop. The answer: ${r.spotName}, ${r.cityName}, ${r.country}. The clue read "${r.prompt}".
${r.postcard ? `The message: "${r.postcard.text}"${r.postcard.from ? `, from ${r.postcard.from}` : ""}.` : "The photo is below."}
The fact players already see (don't repeat it): ${r.fact}
${tellsRule(r.type)}` }];
  if (!r.postcard) {
    if (!r.img) throw new Error("no photo");
    const res = await get(new URL(r.img, SITE.url).href);
    if (!res.ok) throw new Error(`the photo didn't load (${res.status})`);
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: Buffer.from(await res.arrayBuffer()).toString("base64") } });
  }
  return (await ask<{ tells: string }>(content, TELLS)).tells.trim();
}

/** Writes the line for every stop players will still see without one: today's and later flights, then stops waiting in the bank.
 *  Stops starting new work after `until`, so a run ends inside the function's time limit and says how many are left for the next press. */
export async function writeTells(db: Db, today: string, { ask = claude, get = fetch, until = Date.now() + 240_000 }: { ask?: Ask; get?: Get; until?: number } = {}) {
  if (ask === claude && !process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY isn't set");
  let written = 0, left = 0;
  const failed: string[] = [];
  const one = async (r: Round) => {
    if (r.tells) return r;
    if (Date.now() > until) { left++; return r; }
    try { const tells = await tellsFor(r, ask, get); written++; return { ...r, tells }; }
    catch (e) { failed.push(`${r.spotName}: ${e instanceof Error ? e.message : e}`); return r; }
  };
  const flights = (await db.select().from(itineraries).where(gte(itineraries.date, today))).filter(f => !f.rounds.every(r => r.tells));
  // two flights at a time, three stops each: fast enough for a full calendar, gentle on the API's rate limit
  await mapLimit(flights, 2, async f => db.update(itineraries).set({ rounds: await mapLimit(f.rounds, 3, one) }).where(eq(itineraries.date, f.date)));   // saved per flight, so a cut-off run keeps what it wrote
  const bank = (await db.select().from(stopBank).where(and(ne(stopBank.status, "rejected"), isNull(stopBank.usedOn)))).filter(b => !b.round.tells);
  await mapLimit(bank, 6, async b => { const round = await one(b.round); if (round.tells) await db.update(stopBank).set({ round }).where(eq(stopBank.id, b.id)); });
  return { written, failed, left };
}
