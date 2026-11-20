// Rebuilds the mark, favicon, logos and PNG icons from one drawing: a luggage tag with the B over the red "here" pointer.
// Run from the repo root: node brand/build.mjs. The link preview is brand/og.html, captured at 1200 by 630 into og-image.png.
import fs from "node:fs";
import sharp from "sharp";

const INK = "#1a1310", CARD = "#f4ead5", RED = "#e2412e", FELT = "#0f3d2e";
const B = "M48.9 102H10.5Q6.9 102 6.9 98.4V33.6Q6.9 30 10.5 30H42.4Q52.2 30 56.9 33.7Q61.6 37.4 61.6 45.3V50.1Q61.6 58.4 55.7 60.9Q62.2 61.5 65.25 65.25Q68.3 69 68.3 76.4V85.6Q68.3 94 63.6 98Q58.9 102 48.9 102ZM29.4 73.2V85H42.4Q46.2 85 46.2 81V77.1Q46.2 73.2 42.4 73.2ZM29.4 47V57.8H37.9Q41.7 57.8 41.7 53.8V51Q41.7 47 37.9 47Z";
const r2 = n => +n.toFixed(2);
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/** A tag from x0..x1, y0..y1: chamfered top corners, rounded bottom, an edge of width e, and a punched hole. */
function tag({ x0, x1, y0, y1, cut, e, rb, hole: [hy, ro, ri], b: [bs, by], ptr }) {
  const s2 = e * Math.SQRT2, ix0 = x0 + e, ix1 = x1 - e, iy0 = y0 + e, iy1 = y1 - e, ic = r2(cut + s2 - 2 * e), irb = Math.max(rb - e, 2);
  const outer = `M${x0 + cut} ${y0}H${x1 - cut}L${x1} ${y0 + cut}V${y1 - rb}A${rb} ${rb} 0 0 1 ${x1 - rb} ${y1}H${x0 + rb}A${rb} ${rb} 0 0 1 ${x0} ${y1 - rb}V${y0 + cut}Z`;
  const inner = `M${ix0 + ic} ${iy0}H${ix1 - ic}L${ix1} ${r2(iy0 + ic)}V${iy1 - irb}A${irb} ${irb} 0 0 1 ${ix1 - irb} ${iy1}H${ix0 + irb}A${irb} ${irb} 0 0 1 ${ix0} ${iy1 - irb}V${r2(iy0 + ic)}Z`;
  const cx = (x0 + x1) / 2, bx = cx - 37.6 * bs, bty = by - 30 * bs;
  const letter = `<path transform="translate(${bx.toFixed(2)} ${bty.toFixed(2)}) scale(${bs})" fill="${INK}" d="${B}"/>`;
  const [pw, py, ph] = ptr, pointer = `M${cx - pw / 2} ${py}H${cx + pw / 2}L${cx} ${py + ph}Z`;
  return {
    colour: `<path fill="${INK}" fill-rule="evenodd" d="${outer}${circle(cx, hy, ri)}"/>
  <path fill="${CARD}" fill-rule="evenodd" d="${inner}${circle(cx, hy, ro)}"/>
  ${letter}
  <path fill="${RED}" d="${pointer}"/>`,
    mono: `<path fill="${INK}" fill-rule="evenodd" d="${outer}${inner}${circle(cx, hy, ro)}${circle(cx, hy, ri)}"/>
  ${letter}
  <path fill="${INK}" d="${pointer}"/>`,
  };
}

const MARK = tag({ x0: 16, x1: 84, y0: 6, y1: 96, cut: 14, e: 6, rb: 9, hole: [22, 6.5, 3.2], b: [0.52, 32], ptr: [28, 71.5, 14.5] });
const FAV = tag({ x0: 11, x1: 89, y0: 2, y1: 98, cut: 15, e: 8, rb: 10, hole: [20, 8, 4], b: [0.6, 31], ptr: [34, 72, 17] });
const svg = (body, label = true) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${label ? ' role="img" aria-label="Born There"' : ""}>\n  ${body}\n</svg>\n`;

fs.writeFileSync("brand/mark.svg", svg(MARK.colour));
fs.writeFileSync("brand/mark-mono.svg", svg(MARK.mono));
fs.writeFileSync("brand/favicon.svg", svg(FAV.colour));
fs.copyFileSync("brand/favicon.svg", "src/app/icon0.svg");
// the logos keep their wordmark; only the mark inside the group changes
for (const f of ["brand/logo.svg", "brand/logo-light.svg"]) {
  const s = fs.readFileSync(f, "utf8").replace(/(<g transform="translate\(-16\.5 11\) scale\(1\.1\)">)[\s\S]*?(<\/g>)/, `$1\n  ${MARK.colour}$2`);
  fs.writeFileSync(f, s);
}
// PNGs: the 32px favicon on transparent, the app icons on a felt square
await sharp(Buffer.from(svg(FAV.colour, false)), { density: 384 }).resize(32, 32).png().toFile("brand/favicon-32.png");
const onFelt = (n) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${FELT}"/><g transform="translate(15 15) scale(0.7)">${MARK.colour}</g></svg>`), { density: Math.ceil(n * 0.72 * 4) }).resize(n, n).png();
await onFelt(180).toFile("brand/apple-touch-icon.png");
await onFelt(192).toFile("brand/icon-192.png");
await onFelt(512).toFile("brand/icon-512.png");
fs.copyFileSync("brand/favicon-32.png", "src/app/icon1.png");
fs.copyFileSync("brand/apple-touch-icon.png", "src/app/apple-icon.png");
console.log("built");
