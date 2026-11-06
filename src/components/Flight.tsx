"use client";
// The flight band: the day's route as a strip of sky across the top of play. Between stops the plane flies sideways to the next
// runway; during a stop it comes down only as far as your answer earned (Krillion dives for depth; Stamped descends for precision).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { StopData } from "@/lib/client/api";
import { TIERS, type TierId } from "@/lib/game/rules";
import { reducedMotion, sfx } from "@/lib/client/fx";
import { CountUp } from "./bits";

// altitude by how precisely you named the place: over the country, on approach to the city, touchdown at the exact spot
const EARNED: Record<TierId, number> = { native: 0, local: 2000, traveller: 6000, backpacker: 10000, lost: 10000, tourist: 10000, miss: 10000 };
/** How long the plane takes to reach the altitude a finished stop earned; the reveal's stamp waits for it. */
export const DESCENT_MS: Partial<Record<TierId, number>> = { native: 1400, local: 1000, traveller: 700, lost: 600 };
export const FLIGHT_MS = 1800;
const altFor = (s: StopData) => s.state.phase === "done" && s.state.tier ? EARNED[s.state.tier] : s.state.step === "spot" ? 2000 : s.state.step === "city" ? 6000 : 10000;
const ease = (t: number) => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

function status(stops: StopData[], at: number, flying: boolean, from: number) {
  const s = stops[at];
  if (flying) return `Flying from ${stops[from]?.reveal?.cityName ?? "home"} to ???`;
  if (!s) return "";
  if (s.state.phase !== "done" || !s.state.tier || !s.reveal) return s.state.step === "spot" ? "On final approach" : s.state.step === "city" ? "Descending to 2,000 m" : `Cruising over stop ${at + 1}`;
  const r = s.reveal;
  return ({ native: `Touchdown in ${r.cityName}`, local: `On approach over ${r.cityName}`, traveller: `Over ${r.regionName}`, backpacker: `Flew over ${r.country}`,
    lost: "Missed approach: going around", tourist: `Flew over ${r.place}`, miss: "No landing slot" } as Record<TierId, string>)[s.state.tier];
}

export function Plane() {
  return <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)" /></svg>;
}

type Props = { stops: StopData[]; at: number; flight: { from: number; to: number } | null; flownKm: number; onArrive: () => void };
export function FlightBand({ stops, at, flight, flownKm, onArrive }: Props) {
  const box = useRef<HTMLDivElement>(null), world = useRef<HTMLDivElement>(null), plane = useRef<HTMLDivElement>(null), alt = useRef<HTMLSpanElement>(null), clouds = useRef<HTMLDivElement>(null);
  const geo = useRef({ w: 0, h: 0, step: 300, px: 100 });
  const pos = useRef({ cam: (flight ? flight.from : at), alt: 10000 });   // cam is in stops, alt in metres
  const job = useRef<{ kind: "fly" | "alt"; t0: number; ms: number; from: { cam: number; alt: number }; to: { cam: number; alt: number }; done?: () => void } | null>(null);
  const [touchdown, setTouchdown] = useState(-1);
  const shownKm = useRef(flownKm);
  const onArriveRef = useRef(onArrive); onArriveRef.current = onArrive;

  // drawing: the world slides under a plane that keeps its place on screen; clouds drift at their own depths
  const draw = () => {
    const { w, h, step, px } = geo.current, { cam, alt: a } = pos.current;
    const narrow = w < 600, yTop = h * (narrow ? 0.42 : 0.3), yMid = h * (narrow ? 0.66 : 0.58), yRun = h - (narrow ? 36 : 40);   // on a phone the readings take the top row, so the sky starts lower
    const y = a >= 2000 ? yMid + (yTop - yMid) * (a - 2000) / 8000 : yRun + (yMid - yRun) * a / 2000;
    if (world.current) world.current.style.transform = `translateX(${px - cam * step}px)`;
    if (plane.current) plane.current.style.transform = `translate(${px - 14}px, ${y - 14}px)`;
    if (alt.current) alt.current.textContent = `${(Math.round(a / 100) * 100).toLocaleString("en-GB")} m`;
    clouds.current?.childNodes.forEach((c, i) => { const d = 0.25 + (i % 3) * 0.2, span = w + 160; (c as HTMLElement).style.transform = `translateX(${((i * 190 - cam * step * d) % span + span) % span - 120}px)`; });
  };
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const measure = () => { const w = el.clientWidth, h = el.clientHeight; geo.current = { w, h, step: Math.max(220, w * 0.46), px: Math.round(w * (w < 600 ? 0.3 : 0.24)) }; world.current?.style.setProperty("--step", `${geo.current.step}px`); draw(); };
    measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, []);
  // one animation loop, driven by whatever job is current
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const j = job.current;
      if (j) {
        const k = j.ms <= 0 ? 1 : Math.min(1, (now - j.t0) / j.ms), e = ease(k);
        pos.current.cam = j.from.cam + (j.to.cam - j.from.cam) * e;
        // on a flight the plane climbs back to cruise in the first third, whatever height it was at
        pos.current.alt = j.kind === "fly" ? j.from.alt + (10000 - j.from.alt) * ease(Math.min(1, k * 3)) : j.from.alt + (j.to.alt - j.from.alt) * e;
        draw();
        if (k >= 1) { job.current = null; j.done?.(); }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, []);
  const start = (kind: "fly" | "alt", ms: number, to: { cam: number; alt: number }, done?: () => void) => {
    job.current = { kind, t0: performance.now(), ms: reducedMotion() ? 0 : ms, from: { ...pos.current }, to, done };
  };

  // a flight: fly to the next runway, then hand over to the stop
  const flyKey = flight ? `${flight.from}>${flight.to}` : "";
  useEffect(() => {
    if (!flight) return;
    setTouchdown(-1); sfx("takeoff");
    start("fly", FLIGHT_MS, { cam: flight.to, alt: 10000 }, () => onArriveRef.current());
  }, [flyKey]); // eslint-disable-line react-hooks/exhaustive-deps -- one flight per leg

  // during a stop: the plane follows how deep you are, then settles where your answer earned
  const s = stops[at], target = !flight && s ? altFor(s) : 10000, tier = s?.state.phase === "done" ? s.state.tier : null;
  useEffect(() => {
    if (flight || !s) return;
    const ms = tier ? DESCENT_MS[tier] ?? 0 : Math.abs(target - pos.current.alt) > 1 ? 900 : 0;
    start("alt", ms, { cam: at, alt: target }, tier === "native" ? () => { setTouchdown(at); sfx("touchdown"); } : undefined);
  }, [target, tier, at, flight]); // eslint-disable-line react-hooks/exhaustive-deps -- s changes identity on every merge

  const fromKm = shownKm.current; useEffect(() => { shownKm.current = flownKm; }, [flownKm]);
  return (
    <div className="flight" ref={box} role="img" aria-label={`${status(stops, at, !!flight, flight?.from ?? at - 1)}. ${flownKm.toLocaleString("en-GB")} km flown today.`}>
      <div className="fl-clouds" ref={clouds} aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ top: `${14 + (i * 37) % 46}%`, width: 56 + (i % 3) * 30 }} />)}</div>
      <div className="fl-lines" aria-hidden="true">
        <span className="fl-l-country"><b>10,000 m <em>country</em></b></span><span className="fl-l-city"><b>2,000 m <em>city</em></b></span>
      </div>
      <div className="fl-world" ref={world} aria-hidden="true">
        {[-1, ...stops.map((_, i) => i)].map(i => {
          const st = stops[i], done = st?.state.phase === "done", t = done && st.state.tier ? TIERS[st.state.tier] : null;
          return (
            <div key={i} className={`fl-runway${i === at ? " is-here" : ""}${i === touchdown ? " is-touchdown" : ""}${t ? (st.state.tier === "native" ? " is-top" : t.score >= 60 ? " is-deep" : " is-done") : ""}`}
              style={{ left: `calc(var(--step) * ${i})` }}>
              <span className="fl-strip"><b /><b /><b /><b /><b /></span>
              <span className="fl-label">{i < 0 ? "Home" : <>{i + 1} <span className="fl-type">{st.type.toLowerCase()}</span> {done && st.reveal ? st.reveal.code : "???"}</>}</span>
            </div>
          );
        })}
      </div>
      <div className="fl-plane" ref={plane} aria-hidden="true"><Plane /><span className="fl-plane-alt" ref={alt}>10,000 m</span></div>
      <div className="fl-hud" aria-hidden="true">
        <span className="fl-km"><CountUp from={fromKm} to={flownKm} ms={1200} /> km <small>flown</small></span>
        <span className="fl-status">{status(stops, at, !!flight, flight?.from ?? at - 1)}</span>
      </div>
    </div>
  );
}
