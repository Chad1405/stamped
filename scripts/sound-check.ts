// Sound check: renders every sound effect offline in Chrome with the game's own scheduling code, then checks each one is
// audible, never clips, starts and ends in silence, attacks crisply, and that the countdown tick is a double pulse.
// Usage: npm run test:sound   (needs puppeteer-core and Chrome; set PUPPETEER_CORE and CHROME_PATH as for the end-to-end script)
import { createRequire } from "node:module";
import { CUES, MASTER_GAIN, playVoice, type Voice } from "@/lib/client/fx";

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE || "puppeteer-core");
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage();

type Report = { name: string; peak: number; startsSilent: boolean; tailRms: number; msToHalf: number; pulses: number[] };
const reports: Report[] = await page.evaluate(async (cues: Record<string, Voice[]>, src: string, master: number) => {
  const play = new Function(`return (${src})`)() as (a: BaseAudioContext, d: AudioNode, v: Voice) => void;
  const SR = 44100, out: Report[] = [];
  for (const [name, voices] of Object.entries(cues)) {
    const end = Math.max(...voices.map(v => (v.at ?? 0) + (v.attack ?? 0.005) + v.dur)), len = Math.ceil(SR * (end + 0.4));
    const ctx = new OfflineAudioContext(1, len, SR), gain = ctx.createGain();
    gain.gain.value = master; gain.connect(ctx.destination);
    for (const v of voices) play(ctx, gain, v);
    const d = (await ctx.startRendering()).getChannelData(0);
    let peak = 0; for (const x of d) peak = Math.max(peak, Math.abs(x));
    const first = d.findIndex(x => Math.abs(x) > peak / 2);
    const tail = d.subarray(Math.ceil(SR * (end + 0.25)));
    const tailRms = Math.sqrt(tail.reduce((s, x) => s + x * x, 0) / Math.max(1, tail.length));
    // onsets: 5 ms windows that jump above 30% of the loudest window after a quiet stretch
    const win = Math.round(SR * 0.005), env: number[] = [];
    for (let i = 0; i + win <= d.length; i += win) { let m = 0; for (let j = i; j < i + win; j++) m = Math.max(m, Math.abs(d[j])); env.push(m); }
    const top = Math.max(...env), pulses: number[] = [];
    env.forEach((e, k) => { if (e > top * 0.3 && (k === 0 || env[k - 1] <= top * 0.3)) pulses.push(Math.round(k * 5)); });
    out.push({ name, peak: +peak.toFixed(3), startsSilent: Math.abs(d[0]) < 1e-3, tailRms, msToHalf: Math.round(1000 * first / SR), pulses });
  }
  return out;
}, CUES, playVoice.toString(), MASTER_GAIN);
await browser.close();

const fails: string[] = [];
const CRISP = ["submit", "tick", "count", "go", "correct", "bank", "stamp", "land", "landBig", "gold", "board", "reject", "miss", "finale"];
for (const r of reports) {
  const why: string[] = [];
  if (r.peak >= 0.99) why.push(`clips (peak ${r.peak})`);
  if (r.peak < 0.02) why.push(`too quiet (peak ${r.peak})`);
  if (!r.startsSilent) why.push("does not start from silence");
  if (r.tailRms > 1e-3) why.push(`does not fade out (tail ${r.tailRms.toExponential(1)})`);
  if (CRISP.includes(r.name) && r.msToHalf > 8) why.push(`soft attack (${r.msToHalf} ms to half volume)`);
  if (r.name === "tick" && !(r.pulses.length === 2 && Math.abs(r.pulses[1] - r.pulses[0] - 120) <= 15)) why.push(`not a double pulse 120 ms apart (onsets at ${r.pulses.join(", ")} ms)`);
  console.log(`${why.length ? "FAIL" : "ok  "} ${r.name.padEnd(8)} peak ${r.peak.toFixed(2)}, half volume at ${r.msToHalf} ms${r.name === "tick" ? `, onsets ${r.pulses.join(" and ")} ms` : ""}${why.length ? ": " + why.join("; ") : ""}`);
  if (why.length) fails.push(r.name);
}
const missing = ["submit", "tick", "land", "landBig", "gold", "miss"].filter(n => !reports.some(r => r.name === n));
if (missing.length) { console.log("FAIL missing cues: " + missing.join(", ")); fails.push(...missing); }
console.log(fails.length ? `\n${fails.length} sound(s) FAILED` : `\nall ${reports.length} sounds passed`);
process.exit(fails.length ? 1 : 0);
