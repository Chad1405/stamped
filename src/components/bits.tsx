"use client";
// Small pieces every screen shares: the live strip, the entry stamp, crowd bars, a counting number.
import { useEffect, useRef, useState } from "react";
import type { StopData } from "@/lib/client/api";
import { TIERS, type TierId } from "@/lib/game/rules";

export const ordinal = (n: number) => n + (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");
export const longDate = (d: string) => { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }); };
export const shortDate = (d: string) => { const [y, m, dd] = d.split("-"); return `${dd}.${m}.${y.slice(2)}`; };
const DEEP: TierId[] = ["native", "local", "traveller"];

/** The day's five stops, carried through play. */
export function Strip({ stops, current, total }: { stops: StopData[]; current: number; total?: number }) {
  return (
    <ol className="strip" aria-label="Today's five stops">
      {stops.map((s, i) => {
        const done = s.state.phase === "done", live = !done && i === current;
        return (
          <li key={i} className={done ? "is-done" : live ? "is-live" : ""} aria-current={live ? "step" : undefined}>
            <span>{i + 1} <span className="s-type">{s.type.toLowerCase()}</span></span>
            <span>{done && s.reveal ? s.reveal.code : "???"}</span>
          </li>
        );
      })}
      {total !== undefined && <li className="total"><span>Total</span><span>{total}</span></li>}
    </ol>
  );
}

/** The stamp you earn on a stop. */
export function EntryStamp({ s, i, date, motion, delay = 0 }: { s: StopData; i: number; date: string; motion?: string; delay?: number }) {
  if (!s.state.tier || !s.reveal) return null;
  const t = TIERS[s.state.tier], cls = DEEP.includes(s.state.tier) ? "is-deep" : s.state.tier === "miss" ? "is-miss" : "";
  return (
    <div className={`entry ${cls} ${motion ?? ""}`} style={{ ["--i" as string]: delay }} role="img" aria-label={`${t.name} stamp for stop ${i + 1}, ${s.reveal.place}, ${t.score} points`}>
      <span className="e-code">{s.reveal.code}</span><span className="e-name">{t.name}</span>
      <span className="e-meta">Stop {i + 1}, {s.type.toLowerCase()}</span><span className="e-meta">+{t.score} on {shortDate(date)}</span>
    </div>
  );
}

export function CrowdBars({ crowd }: { crowd: NonNullable<StopData["reveal"]>["crowd"] }) {
  const label = crowd.source === "live" ? `How far ${crowd.players} players got` : "How far players usually get (editor's estimate until enough people have played)";
  return (
    <div className="bars"><p className="small">{label}</p>
      <ul aria-label={label}>
        {(["Country", "City", "Exact spot"] as const).map((l, k) => (
          <li key={l}><span>{l}</span><span className="track" aria-hidden="true"><span className="fill" style={{ width: `${crowd.values[k]}%` }} /></span><span>{crowd.values[k]}%</span></li>
        ))}
      </ul>
    </div>
  );
}

const reducedMotion = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
/** A number that counts up to its value, unless the viewer prefers reduced motion. */
export function CountUp({ to, ms = 900, from = 0 }: { to: number; ms?: number; from?: number }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (reducedMotion() || from === to) { setV(to); return; }
    const t0 = performance.now(); let raf = 0;
    const step = (now: number) => { const k = Math.min(1, (now - t0) / ms), e = 1 - (1 - k) ** 3; setV(Math.round(from + (to - from) * e)); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms, from]);
  return <>{v}</>;
}

/** Re-runs a CSS animation class each time `key` changes. */
export function useReplay<T extends HTMLElement>(cls: string, key: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => { const el = ref.current; if (!el || key === undefined || key === null) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }, [cls, key]);
  return ref;
}
