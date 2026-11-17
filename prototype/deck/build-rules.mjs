// Bundles the real game engine (src/lib/game) and flight 001 into rules.js for this prototype.
// Run from the repo root: node prototype/deck/build-rules.mjs
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
await build({
  absWorkingDir: root,
  stdin: {
    loader: "ts",
    resolveDir: root,
    contents: `
      import * as engine from "./src/lib/game/engine";
      import * as rules from "./src/lib/game/rules";
      import { COUNTRIES, norm } from "./src/lib/game/match";
      import cities from "./src/content/cities.json";
      import flights from "./src/content/itineraries.json";
      const f = (flights as any[])[0];
      // photos are read from public/clues, two folders up
      const FLIGHT = { flight: f.flight, rounds: f.rounds.map((r: any) => ({ ...r, img: r.img ? "../../public" + r.img : undefined })) };
      (window as any).BT = { ...rules, ...engine, COUNTRY_NAMES: COUNTRIES.map(c => c.name), CITIES: cities, norm, FLIGHT };
    `,
  },
  bundle: true, format: "iife", minifySyntax: true, tsconfig: "tsconfig.json",
  outfile: "prototype/deck/rules.js", logLevel: "warning",
});
console.log("prototype/deck/rules.js rebuilt");
