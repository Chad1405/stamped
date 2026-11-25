// Builds src/content/cities.json: the city suggestions offered for every country in src/content/countries.json.
// usage: node scripts/cities.mjs <dir with GeoNames cities5000.txt and countryInfo.txt> [answers.json]
// answers.json, optional: {"Country": ["City", ...]}, every answer city already used or waiting in the stop bank.
// City data: GeoNames (https://www.geonames.org), CC BY 4.0, credited on the Terms page.
//
// Each list mixes a country's biggest cities, some smaller towns picked by a stable hash, the hand-made list where there
// was one, and every known answer city. The smaller towns are the point: an answer like Schwangau or Hanga Roa then sits
// among other little-known places instead of standing out in a list of capitals.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const [dir, answersFile] = process.argv.slice(2);
if (!dir) { console.error("usage: node scripts/cities.mjs <geonames dir> [answers.json]"); process.exit(1); }
const root = path.join(import.meta.dirname, "..");
const OUT = path.join(root, "src/content/cities.json");

// must stay the same as norm() in src/lib/game/match.ts
const norm = s => s.replace(/ð/gi, "d").replace(/þ/gi, "th").replace(/æ/gi, "ae").replace(/ł/gi, "l").replace(/ø/gi, "o").replace(/ħ/gi, "h")
  .replace(/đ/gi, "d").replace(/ß/g, "ss").replace(/œ/gi, "oe").replace(/ı/g, "i")
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().replace(/^the /, "");

const BIGGEST = 16, SMALLER = 8, MAX = 36;
const key = s => norm(s).replace(/ city$/, "");   // New York and New York City are one place
// GeoNames spells some countries differently from the game
const NAMES = {
  "Ivory Coast": "CI", "Czechia": "CZ", "North Korea": "KP", "South Korea": "KR", "Myanmar": "MM", "Eswatini": "SZ", "Vatican City": "VA",
  "East Timor": "TL", "Timor-Leste": "TL", "Cape Verde": "CV", "Congo": "CG", "Republic of the Congo": "CG", "DR Congo": "CD",
  "Democratic Republic of the Congo": "CD", "Palestine": "PS", "North Macedonia": "MK", "Micronesia": "FM", "Bahamas": "BS", "Gambia": "GM",
  "United States": "US", "United Kingdom": "GB", "Russia": "RU", "Laos": "LA", "Syria": "SY", "Iran": "IR", "Vietnam": "VN", "Brunei": "BN",
  "Moldova": "MD", "Tanzania": "TZ", "Bolivia": "BO", "Venezuela": "VE", "Taiwan": "TW", "Kosovo": "XK", "Saint Lucia": "LC",
  "Saint Kitts and Nevis": "KN", "Saint Vincent and the Grenadines": "VC", "Sao Tome and Principe": "ST", "São Tomé and Príncipe": "ST",
};
// populated places only, not neighbourhoods, abandoned or historical ones
const SKIP_CODES = new Set(["PPLX", "PPLH", "PPLQ", "PPLW", "PPLCH"]);

const countries = JSON.parse(fs.readFileSync(path.join(root, "src/content/countries.json"), "utf8")).map(c => c.name);
// the lists written by hand before this script; a later run reads its own output, so lists keep their cities and only gain new answers
const handmade = JSON.parse(fs.readFileSync(OUT, "utf8"));
const answers = answersFile ? JSON.parse(fs.readFileSync(answersFile, "utf8")) : {};

const isoByName = new Map();
for (const line of fs.readFileSync(path.join(dir, "countryInfo.txt"), "utf8").split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const c = line.split("\t");
  isoByName.set(norm(c[4]), c[0]);
}
const isoOf = name => NAMES[name] ?? isoByName.get(norm(name));

const byIso = new Map();
for (const line of fs.readFileSync(path.join(dir, "cities5000.txt"), "utf8").split("\n")) {
  const c = line.split("\t");
  if (c.length < 15 || c[6] !== "P" || SKIP_CODES.has(c[7])) continue;
  const name = c[1].trim().replace(/^(Thị Trấn|Thị Xã|Thành Phố|Hansestadt|Lutherstadt) /i, "");   // official prefixes nobody says
  if (!/^[a-z0-9 ]+$/.test(norm(name))) continue;   // the game can't match a name that normalises to nothing
  const alts = new Set([name, ...c[3].split(",")].map(key).filter(Boolean));   // its other spellings, to spot Köln when Cologne is listed
  (byIso.get(c[8]) ?? byIso.set(c[8], []).get(c[8])).push({ name, pop: Number(c[14]) || 0, lat: Number(c[4]), lng: Number(c[5]), alts });
}
const km = (a, b) => { const r = Math.PI / 180, x = (b.lng - a.lng) * r * Math.cos((a.lat + b.lat) * r / 2), y = (b.lat - a.lat) * r; return 6371 * Math.hypot(x, y); };
const SUBURB_KM = 20;   // a place this close to a bigger one already listed is a district of it (Brooklyn, Ruislip), not a city to offer

const hash = s => createHash("sha1").update(s).digest("hex");
const out = {}, missing = [], thin = [];
for (const country of countries) {
  const iso = isoOf(country);
  if (!iso) missing.push(country);
  // biggest first, skipping districts of a bigger place; a small country (Singapore, Qatar) gets a smaller radius, or none
  const all = (byIso.get(iso) ?? []).toSorted((a, b) => b.pop - a.pop);
  let places = [];
  for (const r of [SUBURB_KM, 8, 0]) {
    places = [];
    for (const p of all) if (!places.some(q => km(p, q) < r)) places.push(p);
    if (places.length >= 12) break;
  }
  const seen = new Set(), list = [];
  const add = (n, alts = [key(n)]) => { const k = key(n); if (k && !alts.some(a => seen.has(a)) && list.length < MAX) { seen.add(k); list.push(n); } };
  for (const n of answers[country] ?? []) add(n);   // the answers first, so a cap never drops one
  for (const n of handmade[country] ?? []) add(n);
  for (const p of places.slice(0, BIGGEST)) add(p.name, [...p.alts]);
  const rest = places.slice(BIGGEST), towns = rest.filter(p => p.pop >= 10_000);
  for (const p of (towns.length >= SMALLER ? towns : rest).toSorted((a, b) => hash(a.name).localeCompare(hash(b.name))).slice(0, SMALLER)) add(p.name, [...p.alts]);
  if (list.length >= 8) out[country] = list.toSorted((a, b) => a.localeCompare(b));
  else thin.push(`${country} (${list.length})`);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`${Object.keys(out).length} of ${countries.length} countries have a list (${Object.values(out).flat().length} cities).`);
if (missing.length) console.log(`No GeoNames code for: ${missing.join(", ")}`);
if (thin.length) console.log(`Too few places for a list (they get free typing): ${thin.join(", ")}`);
