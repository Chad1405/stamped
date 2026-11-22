"use client";
// The world map: during the country step, where each wrong guess's capital is and which way and how far the hint points;
// on the back of the card, where the place really is. Mercator, so the compass arrows match the hints, which use the same flat map.
import { useEffect, useRef, useState } from "react";
import capitalsData from "@/content/capitals.json";

type World = { w: number; h: number; countries: { n: string; g: boolean; d: string }[] };
const CAPITALS = capitalsData as unknown as Record<string, [string, number, number]>;
// must match scripts/world-map.mjs, which drew the country shapes
const W = 1000, R = W / (2 * Math.PI), TOP = 83;
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, lat)) * Math.PI / 360));
const project = (lat: number, lng: number): [number, number] => [W / 2 + R * lng * Math.PI / 180, R * (merc(TOP) - merc(lat))];

// fetched the first time a map opens, so the 40 KB of outlines stay off the main page
let world: Promise<World> | null = null;
function useWorld() {
  const [w, setW] = useState<World | null>(null);
  useEffect(() => { let on = true; (world ??= import("@/content/world.json").then(m => m.default as World)).then(x => { if (on) setW(x); }); return () => { on = false; }; }, []);
  return w;
}

/** The great circle `km` from a point, as path data on the map; split where it crosses the edge of the map. */
function ring(lat: number, lng: number, km: number) {
  const rad = Math.PI / 180, d = km / 6371, a = lat * rad, segs: string[] = [];
  let seg = "", prevX: number | null = null;
  for (let i = 0; i <= 96; i++) {
    const b = (i / 96) * 2 * Math.PI;
    const la = Math.asin(Math.sin(a) * Math.cos(d) + Math.cos(a) * Math.sin(d) * Math.cos(b));
    let lo = lng * rad + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(a), Math.cos(d) - Math.sin(a) * Math.sin(la));
    lo = ((lo / rad + 540) % 360) - 180;
    const [x, y] = project(la / rad, lo);
    if (prevX !== null && Math.abs(x - prevX) > W / 2) { segs.push(seg); seg = ""; }
    seg += `${seg ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    prevX = x;
  }
  return [...segs, seg].join("");
}

const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
export type Try = { name: string; km: number | null; dir: string | null };

function Shapes({ world, mark, onTap }: { world: World; mark: (n: string) => string | undefined; onTap?: (n: string) => void }) {
  return <g className="wm-land">{world.countries.map(c => <path key={c.n} d={c.d} className={mark(c.n)} onClick={onTap && (() => onTap(c.n))} />)}</g>;
}

/** The map button under the country hints: opens over the card; the clock keeps running behind it. */
export function GuessMap({ tries, secs }: { tries: Try[]; secs: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const show = () => { setOpen(true); ref.current?.showModal(); };
  return (
    <>
      <button className="btn btn--small wm-open" type="button" onClick={show}>Open the map</button>
      <dialog ref={ref} className="wm-sheet" onClose={() => setOpen(false)} aria-label="Map of your guesses">
        <div className="wm-head">
          <h2>Your guesses</h2>
          <span className="wm-clock" aria-live="off">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")} left</span>
          <button className="btn btn--small" type="button" onClick={() => ref.current?.close()}>Back to the clue</button>
        </div>
        {open && <GuessMapBody tries={tries} />}
      </dialog>
    </>
  );
}

function GuessMapBody({ tries }: { tries: Try[] }) {
  const world = useWorld(), box = useRef<HTMLDivElement>(null);
  const [tapped, setTapped] = useState<string | null>(null);
  const pts = tries.flatMap(t => { const c = CAPITALS[t.name]; return c ? [{ ...t, capital: c[0], at: project(c[1], c[2]), lat: c[1], lng: c[2] }] : []; });
  const last = pts.at(-1)?.at;
  // start centred on the latest guess
  useEffect(() => { const el = box.current, svg = el?.querySelector("svg"); if (!el || !svg || !last) return; const k = svg.clientWidth / W; el.scrollLeft = last[0] * k - el.clientWidth / 2; el.scrollTop = last[1] * k - el.clientHeight / 2; }, [world, last]);
  if (!world) return <p className="wm-wait">Unfolding the map…</p>;
  const guessed = new Set(tries.map(t => t.name));
  return (
    <>
      <div className="wm-scroll" ref={box}>
        <svg viewBox={`0 0 ${W} ${world.h}`} className="wm-svg" role="img" aria-label={`World map showing ${pts.map(p => `${p.name}, ${p.km?.toLocaleString("en-GB")} km ${p.dir} of ${p.capital}`).join("; ")}`}>
          <defs><marker id="wm-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" /></marker></defs>
          <Shapes world={world} mark={n => guessed.has(n) ? "is-wrong" : n === tapped ? "is-tapped" : undefined} onTap={setTapped} />
          {pts.map(p => {
            const k = p.dir ? COMPASS.indexOf(p.dir) : -1, a = k * Math.PI / 4;
            return (
              <g key={p.name} className="wm-guess">
                {p.km && <path d={ring(p.lat, p.lng, p.km)} className="wm-ring" />}
                {k >= 0 && <line x1={p.at[0]} y1={p.at[1]} x2={p.at[0] + 60 * Math.sin(a)} y2={p.at[1] - 60 * Math.cos(a)} className="wm-dir" markerEnd="url(#wm-arrow)" />}
                <circle cx={p.at[0]} cy={p.at[1]} r="4" />
                <text x={p.at[0] + 7} y={p.at[1] - 6}>{p.capital}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="wm-note" role="status">{tapped ? <>That’s <strong>{tapped}</strong>.</> : "Tap a country to see its name."} The dashed circle is how far each guess was; the arrow is which way to head.</p>
    </>
  );
}

/** On the back of the card: the place, the countries you tried, and the line from each to the answer. */
export function AnswerMap({ country, city, lat, lng, guesses }: { country: string; city: string; lat: number; lng: number; guesses: string[] }) {
  const world = useWorld();
  const at = project(lat, lng);
  const tried = guesses.filter(g => g !== country && CAPITALS[g]).map(g => ({ name: g, capital: CAPITALS[g][0], at: project(CAPITALS[g][1], CAPITALS[g][2]) }));
  // frame the answer and every guess, with more room on the right, where the labels sit
  const xs = [at[0], ...tried.map(t => t.at[0])], ys = [at[1], ...tried.map(t => t.at[1])];
  const left = Math.min(...xs), top = Math.min(...ys), spanX = Math.max(...xs) - left, spanY = Math.max(...ys) - top;
  let w = spanX * 1.35 + 130, x0 = left - spanX * 0.08 - 45;
  if (w < 240) { x0 -= (240 - w) / 2; w = 240; }
  const h = Math.max(spanY * 1.3 + 90, w * 0.6), y0 = top - (h - spanY) / 2;
  const u = w / 30;   // labels and dots keep their size whatever the zoom
  return (
    <div className="wm-answer">
      <h2>On the map</h2>
      <svg viewBox={`${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`} className="wm-svg" role="img"
        aria-label={`${city}, ${country}${tried.length ? `, and your guesses: ${tried.map(t => t.name).join(", ")}` : ""}`}>
        {world && <Shapes world={world} mark={n => n === country ? "is-answer" : tried.some(t => t.name === n) ? "is-wrong" : undefined} />}
        {tried.map(t => (
          <g key={t.name} className="wm-guess">
            <line x1={t.at[0]} y1={t.at[1]} x2={at[0]} y2={at[1]} className="wm-dir" />
            <circle cx={t.at[0]} cy={t.at[1]} r={u * 0.35} />
            <text x={t.at[0] + u * 0.6} y={t.at[1] - u * 0.4} fontSize={u}>{t.capital}</text>
          </g>
        ))}
        <g className="wm-place"><circle cx={at[0]} cy={at[1]} r={u * 0.5} /><text x={at[0] + u * 0.7} y={at[1] + u * 0.35} fontSize={u * 1.1}>{city}</text></g>
      </svg>
    </div>
  );
}
