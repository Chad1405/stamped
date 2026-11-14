import { describe, expect, it } from "vitest";
import { createDb } from "@/db";
import seedDays from "@/content/itineraries.json";
import { stopBank } from "@/db/schema";
import type { Round } from "@/lib/game/engine";
import { STOP_TYPES } from "@/lib/game/rules";
import { draftStops, needed, type Ask } from "./drafter";
import { newId } from "./service";

const samples = (seedDays as { rounds: Round[] }[]).flatMap(d => d.rounds);
const sampleOf = (type: string) => samples.find(r => r.type === type)!;
const json = (v: unknown) => new Response(JSON.stringify(v));
const info = (name: string, width: number, height: number, license: string) => ({ title: `File:${name}`, index: width, imageinfo: [{ thumburl: `https://upload.wikimedia.org/${name}`, width, height,
  descriptionurl: `https://commons.wikimedia.org/wiki/File:${name}`, extmetadata: { LicenseShortName: { value: license }, Artist: { value: "Ann" } } }] });
/** Wikipedia and Commons as the job sees them: one usable photo among a portrait and a non-free one. */
const get = (async (url: string) => {
  if (url.includes("en.wikipedia.org")) return json({ query: { pages: [{ extract: "Source text.", fullurl: "https://en.wikipedia.org/wiki/X" }] } });
  if (url.includes("commons.wikimedia.org/w/api.php")) return json({ query: { pages: [info("tall.jpg", 1000, 2000, "CC0"), info("ok.jpg", 2000, 1500, "CC BY 4.0"), info("nc.jpg", 3000, 2000, "CC BY-NC 4.0")] } });
  return new Response(new Uint8Array([1, 2, 3]));
}) as typeof fetch;
const getPhoto = async () => ({ img: `/p/${newId()}.jpg`, credit: { title: "t", author: "a", license: "CC0", url: "u" } });

/** Claude, answering from the sample stops but naming a new place, so the bank doesn't see a duplicate. */
function fakeClaude(seen: { images: number[] }, usable = (type: string) => type !== "Food"): Ask {
  return (async (content, schema) => {
    const text = content.map(b => b.type === "text" ? b.text : "").join(" "), type = STOP_TYPES.find(t => text.includes(`${t} stop`))!;
    const r = sampleOf(type);
    if ("ideas" in (schema.properties as object)) return { ideas: [{ country: r.country, cityName: r.cityName, spotName: "Zorbatron", wikipedia: "X", photoSearch: "x" }] };
    seen.images.push(content.filter(b => b.type === "image").length);
    return { ...r, usable: usable(type), concerns: usable(type) ? "" : "no good photo", photo: 0, alt: r.alt ?? "", spotName: "Zorbatron", spot: ["Zorbatron"],
      message: r.postcard?.text ?? "", messageLang: "es", messageFrom: "+54", messageNote: "Text message", translation: r.postcard ? "Hello" : "" };
  }) as Ask;
}

describe("drafting stops", () => {
  it("asks for a week of each type until three weeks are waiting", async () => {
    const db = await createDb();
    expect(await needed(db)).toEqual(Object.fromEntries(STOP_TYPES.map(t => [t, 7])));
    await db.insert(stopBank).values(Array.from({ length: 16 }, () => ({ id: newId(), round: sampleOf("Food") })));
    await db.insert(stopBank).values(Array.from({ length: 30 }, () => ({ id: newId(), status: "rejected" as const, round: sampleOf("Landmark") })));
    const n = await needed(db);
    expect([n.Food, n.Landmark]).toEqual([5, 7]);   // rejected stops don't count as stock
  });

  it("drafts from real sources into the review queue, through the bank's checks", async () => {
    const db = await createDb(), seen = { images: [] as number[] };
    const { added, skipped } = await draftStops(db, { ask: fakeClaude(seen), get, getPhoto });
    expect(added).toBe(4);
    expect(skipped).toEqual(["Zorbatron: Claude passed on it: no good photo"]);
    expect(seen.images.toSorted()).toEqual([0, 1, 1, 1, 1]);   // only the free, landscape photo reaches Claude; the Language stop has none
    const rows = await db.select().from(stopBank);
    expect(rows.every(r => r.status === "pending" && r.source === "https://en.wikipedia.org/wiki/X")).toBe(true);
    const lang = rows.find(r => r.round.type === "Language")!, landmark = rows.find(r => r.round.type === "Landmark")!;
    expect(lang.round.postcard?.text).toBe(sampleOf("Language").postcard!.text);
    expect(lang.note).toContain("In English: Hello");
    expect(landmark.round.img).toMatch(/^\/p\//);
    expect(landmark.round.spot).toEqual(["zorbatron"]);   // accepted spellings are normalised
  });
});
