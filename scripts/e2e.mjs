// End-to-end: plays a whole day through the real pages, then two players form a league by invite link.
// Usage: node scripts/e2e.mjs [baseUrl] [screenshotDir]   (needs puppeteer-core and Chrome; set PUPPETEER_CORE and CHROME_PATH)
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE || "puppeteer-core");
const BASE = process.argv[2] || "http://localhost:3100", OUT = process.argv[3] || ".e2e";
fs.mkdirSync(OUT, { recursive: true });
const answers = JSON.parse(fs.readFileSync(new URL("../src/content/itineraries.json", import.meta.url))).find(d => d.offset === 0).rounds;
const fails = [], ok = (c, m) => { if (c) console.log("ok  " + m); else { fails.push(m); console.log("FAIL " + m); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
async function player(width = 1440) {
  const ctx = await browser.createBrowserContext(), p = await ctx.newPage();
  await p.setViewport({ width, height: 900 });
  p.errors = []; p.on("pageerror", e => p.errors.push(e.message)); p.on("console", m => m.type() === "error" && p.errors.push(m.text()));
  return p;
}
const text = p => p.evaluate(() => document.body.innerText);
const clickText = (p, label) => p.evaluate(l => { const b = [...document.querySelectorAll("button")].find(x => x.innerText.trim().startsWith(l) && !x.disabled); if (!b) throw new Error("no button " + l); b.click(); }, label);
async function guess(p, value) {
  await p.waitForSelector("#guess:not([disabled])", { timeout: 8000 });
  await p.$eval("#guess", el => { el.value = ""; });
  await p.type("#guess", value); await p.keyboard.press("Enter");
}

// --- Alice plays today's whole flight through the UI ---
const alice = await player();
process.on("unhandledRejection", async e => {
  console.log("FAIL " + e.message.split("\n")[0]);
  try { await alice.screenshot({ path: `${OUT}/failure.png`, fullPage: true }); console.log("    page: " + (await text(alice)).replace(/\s+/g, " ").slice(0, 600)); } catch {}
  await browser.close(); process.exit(1);
});
await alice.goto(BASE, { waitUntil: "networkidle0" });
await alice.waitForFunction(() => document.body.innerText.includes("Board flight"));
ok((await text(alice)).includes("Board flight 004"), "start screen shows today's flight");
await alice.screenshot({ path: `${OUT}/1-start.png`, fullPage: true });
await clickText(alice, "Board flight");
await alice.waitForSelector(".count", { timeout: 5000 });
ok(true, "countdown shows before typing opens");
for (let i = 0; i < 5; i++) {
  const r = answers[i];
  const html = await alice.content();
  ok(!html.includes(r.cityName) || i > 0 && false, `stop ${i + 1}: the answer is not in the page before it is played`);
  await guess(alice, i === 0 ? "Chlie" : r.country);
  if (i === 0) {
    await alice.waitForFunction(() => document.querySelector("#msg")?.innerText.includes("Did you mean"));
    ok(true, "a typo gets a correction"); await alice.keyboard.press("Enter");
  }
  await alice.waitForSelector(".choice--risk"); if (i === 0) await alice.screenshot({ path: `${OUT}/2-decide.png`, fullPage: true });
  await alice.keyboard.press("d");
  await guess(alice, r.cityName); await alice.waitForSelector(".choice--risk"); await alice.click(".choice--risk");
  await guess(alice, r.spot[0]);
  await alice.waitForFunction(() => /Board stop|Open your passport/.test(document.body.innerText));
  if (i === 0) { await wait(700); await alice.screenshot({ path: `${OUT}/3-reveal.png`, fullPage: true }); ok((await text(alice)).includes("Valparaíso, Chile"), "the reveal names the place"); }
  await clickText(alice, i < 4 ? "Board stop" : "Open your passport");
  if (i < 4) await alice.waitForSelector(".count", { timeout: 5000 }).catch(() => {});
}
await alice.waitForFunction(() => document.body.innerText.includes("Your passport grew"));
await wait(1600);
const done = await text(alice);
ok(done.includes("500") && done.includes("Citizen of the world"), "a perfect day scores 500");
ok(done.includes("5 new countries"), "the passport counts 5 new countries");
await alice.screenshot({ path: `${OUT}/4-done.png`, fullPage: true });

// reload: the server remembers, and the stops cannot be replayed
await alice.reload({ waitUntil: "networkidle0" });
await alice.waitForFunction(() => document.body.innerText.includes("Your passport grew"));
ok(true, "after a reload the finished day opens on the passport");

// --- Alice starts a league, Bob joins from the invite link ---
await clickText(alice, "Friends");
await alice.waitForSelector("#my-name");
await alice.$eval("#my-name", el => { el.value = ""; }); await alice.type("#my-name", "Alice"); await clickText(alice, "Save name");
await alice.type("#league-name", "Trip club"); await clickText(alice, "Create");
await alice.waitForFunction(() => /Code [A-Z2-9]{6}/.test(document.body.innerText));
const code = (await text(alice)).match(/Code ([A-Z2-9]{6})/)[1];
ok(!!code, `league created with code ${code}`);

const bob = await player(375);
await bob.goto(`${BASE}/?join=${code}`, { waitUntil: "networkidle0" });
await bob.waitForSelector("#join-code");
ok((await bob.$eval("#join-code", el => el.value)) === code, "the invite link fills in the code");
await bob.type("#my-name", "Bob"); await clickText(bob, "Save name");
await clickText(bob, "Join");
await bob.waitForFunction(() => document.body.innerText.includes("Trip club"));
const board = await bob.evaluate(() => [...document.querySelectorAll(".league tbody tr")].map(r => r.innerText.replace(/\s+/g, " ").trim()));
console.log("    Bob's board: " + board.join(" | "));
ok(board.length === 2 && board[0].startsWith("1st Alice") && board[0].includes("500"), "Bob sees Alice 1st with 500");
ok(!(await bob.evaluate(() => document.documentElement.scrollWidth > innerWidth)), "phone: no sideways scroll");
await bob.screenshot({ path: `${OUT}/5-league-phone.png`, fullPage: true });

ok(alice.errors.length === 0 && bob.errors.length === 0, "no page errors " + [...alice.errors, ...bob.errors].join(" | "));
await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nall end-to-end checks passed");
process.exit(fails.length ? 1 : 0);
