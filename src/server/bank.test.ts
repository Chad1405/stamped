import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { createDb, type Db } from "@/db";
import seedDays from "@/content/itineraries.json";
import { itineraries, stopBank } from "@/db/schema";
import type { Round } from "@/lib/game/engine";
import { addDays } from "@/lib/game/streak";
import { addDrafts, applyReviewForm, bankOverview, cleanPhoto, creditFromCommons, reviewStop, stopProblems } from "./bank";
import { fillFromBank, getDay, ensurePlayer, keepCalendar, newId } from "./service";

const TODAY = "2026-11-05", tomorrow = addDays(TODAY, 1);
const days = (seedDays as { rounds: Round[] }[]).map(d => d.rounds);
const stop = days[0][0];
/** A sample stop made to look real: its own photo and message. */
const realCopy = (r: Round): Round => ({ ...r, img: r.img && `https://x/${newId()}.jpg`, postcard: r.postcard && { ...r.postcard, text: `Real ${newId()}` } });
const approve = (db: Db, rounds: Round[]) => db.insert(stopBank).values(rounds.map(round => ({ id: newId(), status: "approved" as const, round })));
const flight = async (db: Db, date: string) => (await db.select().from(itineraries)).find(r => r.date === date);
const commons = (license: string, width = 2000) => ({ width, descriptionurl: "https://commons.wikimedia.org/wiki/File:X.jpg", extmetadata: { LicenseShortName: { value: license }, Artist: { value: '<a href="/wiki/User:A">Ann &amp; Bo</a>' } } });
const draftOf = (r: Round) => { const { img: _i, credit: _c, ...rest } = r; return { ...rest, photo: "https://commons.wikimedia.org/wiki/File:X.jpg" }; };
const photo = async () => ({ img: `/p/${newId()}.jpg`, credit: { title: "t", author: "a", license: "CC0", url: "u" } });

describe("what can go live", () => {
  it("every sample stop passes, so the checks match real content", () => {
    for (const r of days.flat()) expect(stopProblems(r), r.spotName).toEqual([]);
  });
  it("names what's wrong", () => {
    const has = (edit: Partial<Round>, text: string) => expect(stopProblems({ ...stop, ...edit }).join(" ")).toContain(text);
    has({ country: "Atlantis" }, "isn't a country");
    has({ spotLabel: "Name the landmark" }, "final question");
    has({ spotWord: "Neighbourhood" }, "short label");
    has({ alt: `A statue in ${stop.cityName} at dusk` }, "photo description gives away");
    has({ crowd: [10, 50, 5] }, "Crowd");
    has({ credit: undefined }, "credit");
    has({ spot: ["x"], spotStrip: "^.*$" }, "played through");
  });
});

describe("photos", () => {
  it("takes only licences that allow commercial use with credit", () => {
    for (const ok of ["CC BY-SA 4.0", "CC BY 2.0", "CC0", "Public domain"]) expect(creditFromCommons("File:A_b.jpg", commons(ok)).license).toBe(ok);
    for (const no of ["CC BY-NC 4.0", "CC BY-NC-SA 3.0", "CC BY-ND 4.0", "Fair use", ""]) expect(() => creditFromCommons("File:A_b.jpg", commons(no))).toThrow(/licence/);
    expect(() => creditFromCommons("File:A.jpg", commons("CC0", 500))).toThrow(/small/);
  });
  it("credits the author in plain text and names the file", () => {
    expect(creditFromCommons("File:Old_town.jpg", commons("CC BY 4.0"))).toEqual(expect.objectContaining({ author: "Ann & Bo", title: "Old town" }));
  });
  it("strips what a file says about where it was taken", async () => {
    const raw = await sharp({ create: { width: 2000, height: 3000, channels: 3, background: "#369" } }).withExif({ IFD0: { ImageDescription: "Taken in Reykjavik" } }).jpeg().toBuffer();
    expect((await sharp(raw).metadata()).exif).toBeDefined();
    const out = await sharp(await cleanPhoto(raw)).metadata();
    expect([out.width, out.height, out.format, out.exif]).toEqual([960, 720, "jpeg", undefined]);
  });
});

describe("the bank", () => {
  it("takes a batch, skipping stops that fail or are already known", async () => {
    const db = await createDb(), fresh = { ...stop, spotName: "Somewhere new" };
    const { added, skipped } = await addDrafts(db, [draftOf(fresh), draftOf(fresh), draftOf(stop), { ...draftOf(fresh), spotName: "Other", country: "Atlantis" }], photo);
    expect(added).toBe(1);
    expect(skipped).toEqual([expect.stringContaining("already in the bank"), expect.stringContaining("already in the bank"), expect.stringContaining("Atlantis")]);
    expect((await addDrafts(db, [{ junk: true }], photo)).skipped).toHaveLength(1);   // a malformed stop is a skip, not a crash
    await expect(addDrafts(db, { not: "a list" }, photo)).rejects.toThrow(/list/);
  });
  it("needs a person: pending stops never reach the calendar", async () => {
    const db = await createDb();
    await db.insert(stopBank).values(days[0].map(realCopy).map(round => ({ id: newId(), round })));
    expect(await fillFromBank(db, TODAY)).toBe(0);
  });
  it("saves edits on approval, and holds a stop back while it has problems", async () => {
    const db = await createDb(), id = "a";
    await db.insert(stopBank).values({ id, round: realCopy(stop) });
    await reviewStop(db, id, "approve", r => ({ ...r, country: "Atlantis" }), TODAY);
    let [row] = await db.select().from(stopBank);
    expect([row.status, row.round.country]).toEqual(["pending", "Atlantis"]);   // the edit is kept so it can be fixed
    const f = new FormData();
    for (const [k, v] of Object.entries({ prompt: "New clue?", alt: "A tall church", country: stop.country, cityName: stop.cityName, city: stop.city.join(", "), regionName: stop.regionName, region: stop.region.join(", "), spotLabel: stop.spotLabel, spotWord: stop.spotWord, spotName: stop.spotName, spot: "Atomium Extra, atomium", airport: stop.airport, fact: "Edited.", crowd: "70, 60, 50" })) f.set(k, v);
    await reviewStop(db, id, "approve", r => applyReviewForm(r, f), TODAY);
    [row] = await db.select().from(stopBank);
    expect(row.status).toBe("approved");
    expect([row.round.prompt, row.round.spot, row.round.crowd]).toEqual(["New clue?", ["atomium extra", "atomium"], [70, 60, 50]]);
    await reviewStop(db, id, "reject", r => r, TODAY);
    expect((await db.select().from(stopBank))[0].status).toBe("approved");   // a decided stop stays decided
  });
  it("builds easy-to-hard flights over the samples, never touching today", async () => {
    const db = await createDb(), pid = await ensurePlayer(db, undefined);
    await keepCalendar(db, TODAY, true);
    const before = await flight(db, TODAY), planned = await flight(db, tomorrow);
    await approve(db, days[0].map(realCopy));
    await keepCalendar(db, TODAY, true);
    expect(await flight(db, TODAY)).toEqual(before);
    const made = await flight(db, tomorrow);
    expect(made!.flight).toBe(planned!.flight);
    const rounds = made!.rounds as Round[];
    expect(rounds.map(r => r.spotName).sort()).toEqual(days[0].map(r => r.spotName).sort());
    expect(rounds.map(r => r.crowd[0])).toEqual(rounds.map(r => r.crowd[0]).toSorted((a, b) => b - a));
    expect(await fillFromBank(db, TODAY)).toBe(0);   // each stop is used once
    expect((await getDay(db, pid, tomorrow, tomorrow)).stops).toHaveLength(5);
    const { realDays, calendar } = await bankOverview(db, TODAY);
    expect([realDays, calendar[0].real, calendar[1].real]).toEqual([1, true, false]);
  });
  it("leaves a real flight alone, and waits until it has one of every type", async () => {
    const db = await createDb(), real = days[0].map(realCopy);
    await db.insert(itineraries).values({ date: tomorrow, flight: "001", rounds: real });
    await approve(db, days[1].map(realCopy).slice(0, 4));
    expect(await fillFromBank(db, TODAY)).toBe(0);
    expect((await flight(db, tomorrow))!.rounds).toEqual(real);
    expect((await db.select().from(stopBank)).every(s => s.usedOn === null)).toBe(true);
  });
  it("won't bring a country back within a week", async () => {
    const db = await createDb(), rounds = days[0].map(realCopy);
    await approve(db, [...rounds, ...rounds.map(realCopy)]);   // two of every stop, same countries
    expect(await fillFromBank(db, TODAY)).toBe(1);
  });
});
