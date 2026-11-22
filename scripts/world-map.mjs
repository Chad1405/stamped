// Builds src/content/world.json: one Mercator SVG path per country, named as the game names it, for the map in the country step.
// Run from a folder that has world-atlas@2, topojson-client@3 and d3-geo@3 installed:  node <repo>/scripts/world-map.mjs <repo>
// Natural Earth 110m outlines (public domain) via world-atlas (ISC). Small countries are absent at this scale; the map plots capitals as dots anyway.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.cwd(), "x.js"));
const { feature } = require("topojson-client");
const { geoMercator, geoPath } = require("d3-geo");
const repo = process.argv[2];

// must match src/components/WorldMap.tsx
const W = 1000, R = W / (2 * Math.PI), TOP = 83, BOTTOM = -56;
const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
const H = Math.round(R * (merc(TOP) - merc(BOTTOM)));
const projection = geoMercator().scale(R).translate([W / 2, R * merc(TOP)]).clipExtent([[0, 0], [W, H]]);
const draw = geoPath(projection).digits(1);

const game = JSON.parse(fs.readFileSync(path.join(repo, "src/content/countries.json"), "utf8"));
const key = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
const byKey = new Map(game.flatMap(c => [c.name, ...c.aliases].map(n => [key(n), c.name])));
// Natural Earth's short labels that aren't a game name or alias
const SHORT = { "Dem. Rep. Congo": "DR Congo", "Central African Rep.": "Central African Republic", "Bosnia and Herz.": "Bosnia and Herzegovina",
  "S. Sudan": "South Sudan", "Dominican Rep.": "Dominican Republic", "Eq. Guinea": "Equatorial Guinea", "Solomon Is.": "Solomon Islands",
  "eSwatini": "Eswatini", "United States of America": "United States", "Côte d'Ivoire": "Ivory Coast", "Macedonia": "North Macedonia",
  "Czechia": "Czech Republic", "Timor-Leste": "East Timor" };
const atlas = require("world-atlas/countries-110m.json");
const out = [], unmatched = [];
for (const f of feature(atlas, atlas.objects.countries).features) {
  if (f.properties.name === "Antarctica" || f.properties.name === "Fr. S. Antarctic Lands") continue;
  const raw = f.properties.name, name = byKey.get(key(SHORT[raw] ?? raw)) ?? byKey.get(key(raw));
  if (!name) unmatched.push(raw);
  const d = draw(f);
  if (d) out.push({ n: name ?? raw, g: !!name, d });   // g: a country the game asks about
}
fs.writeFileSync(path.join(repo, "src/content/world.json"), JSON.stringify({ w: W, h: H, countries: out }));
console.log(`${out.length} shapes, ${H}px tall; not game countries:`, unmatched.join(", "));
