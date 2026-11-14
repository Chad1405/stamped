// The stop bank's way in: drafts are checked and their photos cleaned, a person approves them, and fillFromBank schedules what's approved.
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { asc, count, eq, and, isNull, gt } from "drizzle-orm";
import sharp from "sharp";
import type { Db } from "@/db";
import { itineraries, stopBank } from "@/db/schema";
import { applyAction, freshStop, type Action, type Round } from "@/lib/game/engine";
import { countryByName, norm } from "@/lib/game/match";
import { PREVIEW_MS, STOP_TYPES } from "@/lib/game/rules";
import { addDays } from "@/lib/game/streak";
import { DAYS_AHEAD, fillFromBank, HttpError, isSampleFlight, newId, SAMPLES } from "./service";

/** The widest word that fits a box of the points ladder on a 320px phone. */
const MAX_WORD = 8;

function playsPerfectly(r: Round) {
  const moves: Action[] = [{ type: "start" }, { type: "guess", text: r.country }, { type: "decide", deeper: true }, { type: "guess", text: r.cityName }, { type: "decide", deeper: true }, { type: "guess", text: r.spot[0] }];
  return moves.reduce((s, a, i) => applyAction(r, s, a, i ? PREVIEW_MS : 0).state, freshStop()).tier === "native";
}

/** Why a stop can't go live. Empty means it's ready. */
export function stopProblems(r: Round): string[] {
  const out: string[] = [];
  if (!STOP_TYPES.includes(r.type)) out.push(`Type must be one of: ${STOP_TYPES.join(", ")}.`);
  if (r.type === "Language" ? !r.postcard?.text : !r.img || !r.alt || !r.credit) out.push(r.type === "Language" ? "A Language stop needs a message." : "A photo stop needs a photo, a description and a credit.");
  if (!countryByName(r.country)) out.push(`"${r.country}" isn't a country the game knows.`);
  if (!/^What (is|are) .+ called\?$/.test(r.spotLabel)) out.push(`The final question should read "What is ... called?"`);
  if (r.spotWord.split(" ").some(w => !w || w.length > MAX_WORD)) out.push(`The short label needs words of ${MAX_WORD} letters or fewer, or it won't fit on a phone.`);
  if (!r.spotName || !r.cityName || !r.regionName || !r.fact) out.push("The answer names and the fact can't be empty.");
  if (!r.spot.length || !r.city.length || !r.region.length) out.push("Each answer needs at least one accepted spelling.");
  if (!/^[A-Z]{3}$/.test(r.airport)) out.push("The airport must be a three-letter code.");
  if (r.crowd.length !== 3 || r.crowd.some(n => !(n >= 0 && n <= 100)) || r.crowd[0] < r.crowd[1] || r.crowd[1] < r.crowd[2]) out.push("Crowd estimates must be three percentages, falling from country to final question.");
  if (typeof r.lat !== "number" || typeof r.lng !== "number") out.push("The city's coordinates are missing.");
  // these reach the browser before the player has guessed
  const answers = [r.country, r.cityName, ...r.city, r.spotName, r.spot[0]].map(norm).filter(a => a.length > 3);   // only the main final answer: a stop may also accept a plain word like "balcony"
  for (const [label, text] of [["photo description", r.alt], ["clue", r.prompt], ["final question", r.spotLabel]] as const)
    if (text && answers.some(a => ` ${norm(text)} `.includes(` ${a} `))) out.push(`The ${label} gives away the answer.`);
  if (!out.length && !playsPerfectly(r)) out.push("The answers don't work when played through. Check the accepted spellings.");
  return out;
}

/* ---- photos ---- */
export const UA = { "user-agent": "Stamped-content-import/1.0" };   // Wikimedia asks automated clients to identify themselves
const stripTags = (s = "") => s.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();
const FREE_TO_USE = /^(cc0|cc by(-sa)? \d(\.\d)?|public domain)\b/i;
export type CommonsInfo = { thumburl?: string; width: number; descriptionurl: string; extmetadata: Record<string, { value: string } | undefined> };

/** The credit for a Commons file, or an error if its licence doesn't allow commercial use with credit. */
export function creditFromCommons(title: string, info: CommonsInfo): NonNullable<Round["credit"]> {
  const m = info.extmetadata, license = stripTags(m.LicenseShortName?.value);
  if (!FREE_TO_USE.test(license)) throw new Error(`licence not allowed: ${license || "none given"}`);
  if (info.width < 960) throw new Error(`photo too small: ${info.width}px wide`);
  const author = stripTags(m.Artist?.value);
  if (!author && !/^(cc0|public domain)/i.test(license)) throw new Error("no author to credit");
  return { title: stripTags(m.ObjectName?.value) || title.replace(/^File:/, "").replace(/\.\w+$/, "").replace(/_/g, " "), author: author || "Unknown", license, url: info.descriptionurl };
}

/** Same shape as every clue, with the file's metadata gone: location data and captions would give away the answer. */
export const cleanPhoto = (bytes: Buffer) => sharp(bytes).rotate().resize(960, 720, { fit: "cover", position: sharp.strategy.attention }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();

async function storePhoto(bytes: Buffer) {
  const name = `${newId()}.jpg`;   // the browser sees this before the player guesses, so it says nothing
  if (process.env.BLOB_READ_WRITE_TOKEN) return (await put(`clues/${name}`, bytes, { access: "public", contentType: "image/jpeg", addRandomSuffix: false })).url;
  if (process.env.VERCEL) throw new Error("photo storage isn't set up (BLOB_READ_WRITE_TOKEN)");
  const dir = path.join(process.cwd(), "public", "clues", "bank");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  return `/clues/bank/${name}`;
}

type Photo = { img: string; credit: NonNullable<Round["credit"]> };
export async function commonsPhoto(url: string): Promise<Photo> {
  const page = new URL(url), title = decodeURIComponent(page.pathname.split("/wiki/")[1] ?? "");
  if (page.hostname !== "commons.wikimedia.org" || !title.startsWith("File:")) throw new Error("photo must be a Wikimedia Commons file page");
  const q = new URLSearchParams({ action: "query", titles: title, prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "1280", format: "json", formatversion: "2" });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${q}`, { headers: UA });
  if (!res.ok) throw new Error(`Commons said ${res.status}`);
  const info = ((await res.json()) as { query?: { pages?: { imageinfo?: CommonsInfo[] }[] } }).query?.pages?.[0]?.imageinfo?.[0];
  if (!info) throw new Error("Commons has no such file");
  const credit = creditFromCommons(title, info), src = new URL(info.thumburl ?? "");
  if (!src.hostname.endsWith(".wikimedia.org")) throw new Error("unexpected image host");
  const img = await fetch(src, { headers: UA });
  if (!img.ok) throw new Error(`photo download said ${img.status}`);
  return { img: await storePhoto(await cleanPhoto(Buffer.from(await img.arrayBuffer()))), credit };
}

/* ---- drafts in ---- */
export type Draft = Omit<Round, "img" | "credit"> & { photo?: string; note?: string; source?: string };
const dupKey = (r: { country: string; spotName: string }) => `${norm(r.country)}|${norm(r.spotName)}`;

/** Adds a batch for review. A stop that fails is skipped with its reason; the rest still go in. */
export async function addDrafts(db: Db, input: unknown, getPhoto: (url: string) => Promise<Photo> = commonsPhoto) {
  if (!Array.isArray(input)) throw new HttpError(400, "Expected a JSON list of stops.");
  const seen = new Set([...SAMPLES.flatMap(d => d.rounds), ...(await db.select({ round: stopBank.round }).from(stopBank)).map(s => s.round)].map(dupKey));   // rejected stops count: don't offer them twice
  let added = 0;
  const skipped: string[] = [];
  for (const draft of input as Draft[]) {
    const name = draft?.spotName || draft?.cityName || "A stop";
    try {
      const { photo, note, source, ...rest } = draft;
      if (seen.has(dupKey(rest))) throw new Error("already in the bank");
      const round: Round = { ...rest, ...(rest.type === "Language" ? {} : await getPhoto(String(photo))) };
      const problems = stopProblems(round);
      if (problems.length) throw new Error(problems.join(" "));
      await db.insert(stopBank).values({ id: newId(), round, note: note ?? "", source: source ?? "" });
      seen.add(dupKey(rest));
      added++;
    } catch (e) { skipped.push(`${name}: ${e instanceof Error ? e.message : e}`); }
  }
  return { added, skipped };
}

/* ---- review ---- */
const list = (s: string) => s.split(",").map(norm).filter(Boolean);
/** A review form's fields over the stop they were drawn from. */
export function applyReviewForm(r: Round, f: FormData): Round {
  const text = (k: string) => String(f.get(k) ?? "").trim();
  return {
    ...r, prompt: text("prompt"), country: text("country"), cityName: text("cityName"), city: list(text("city")), regionName: text("regionName"), region: list(text("region")),
    spotLabel: text("spotLabel"), spotWord: text("spotWord"), spotName: text("spotName"), spot: list(text("spot")), airport: text("airport"), fact: text("fact"),
    crowd: text("crowd").split(",").map(Number),
    ...(r.postcard ? { postcard: { ...r.postcard, text: text("message") } } : { alt: text("alt") }),
  };
}

/** Saves the reviewer's edits. Approving a stop with problems keeps it pending; the page shows why. */
export async function reviewStop(db: Db, id: string, decision: "approve" | "reject", edit: (r: Round) => Round, today: string) {
  const [row] = await db.select().from(stopBank).where(and(eq(stopBank.id, id), eq(stopBank.status, "pending")));
  if (!row) return;
  const round = edit(row.round);
  const status = decision === "reject" ? "rejected" : stopProblems(round).length ? "pending" : "approved";
  await db.update(stopBank).set({ round, status }).where(eq(stopBank.id, id));
  if (status === "approved") await fillFromBank(db, today);
}

export async function bankOverview(db: Db, today: string) {
  const [pending, waiting, flights] = await Promise.all([
    db.select().from(stopBank).where(eq(stopBank.status, "pending")).orderBy(asc(stopBank.createdAt)),
    db.select({ round: stopBank.round }).from(stopBank).where(and(eq(stopBank.status, "approved"), isNull(stopBank.usedOn))),
    db.select().from(itineraries).where(gt(itineraries.date, today)).orderBy(asc(itineraries.date)),
  ]);
  const byDate = new Map(flights.map(f => [f.date, f]));
  const calendar = Array.from({ length: DAYS_AHEAD }, (_, k) => addDays(today, k + 1)).map(date => {
    const f = byDate.get(date), rounds = (f?.rounds ?? []) as Round[];
    return { date, flight: f?.flight ?? null, real: !!f && !isSampleFlight(rounds), places: rounds.map(r => r.cityName) };
  });
  return { pending, waiting: STOP_TYPES.map(type => ({ type, n: waiting.filter(w => w.round.type === type).length })), calendar, realDays: calendar.findIndex(d => !d.real) < 0 ? calendar.length : calendar.findIndex(d => !d.real) };
}
