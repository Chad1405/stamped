"use client";
// Small pieces every screen shares: the cards, the deck, crowd bars, a counting number.
import { useEffect, useRef, useState } from "react";
import type { StopData } from "@/lib/client/api";
import { TIERS } from "@/lib/game/rules";

export const ordinal = (n: number) => n + (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");
export const longDate = (d: string) => { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }); };
export const shortDate = (d: string) => { const [y, m, dd] = d.split("-"); return `${dd}.${m}.${y.slice(2)}`; };

/** A played stop as a small card: number, airport code, points and the stamp's name. */
export function MiniCard({ s, i, style }: { s: StopData; i: number; style?: React.CSSProperties }) {
  const tier = s.state.tier, t = tier ? TIERS[tier] : null;
  return (
    <span className={`mini t-${tier ?? "miss"}`} style={style} role="img" aria-label={`Stop ${i + 1}${s.reveal ? `, ${s.reveal.place}` : ""}: ${t?.name ?? "not played"}, ${s.state.points} points`}>
      <span className="m-n" aria-hidden="true">{i + 1}</span>
      <span className="m-code" aria-hidden="true">{s.reveal?.code ?? "???"}</span>
      <span className="m-pts" aria-hidden="true">{s.state.points}</span>
      <span className="m-tier" aria-hidden="true">{t?.name ?? ""}</span>
    </span>
  );
}

/** Today's hand on the start screen: played stops face up, the rest face down, the next one glowing. */
export function Fan({ stops, current }: { stops: StopData[]; current: number }) {
  const n = stops.length;
  return (
    <ol className="fan" aria-label={`Today's ${n} stops, ${stops.filter(s => s.state.phase === "done").length} played`}>
      {stops.map((s, k) => {
        const done = s.state.phase === "done", off = k - (n - 1) / 2;
        return (
          <li key={k} className={!done && k === current ? "is-live" : undefined} style={{ ["--r" as string]: `${off * 9}deg`, ["--y" as string]: `${Math.abs(off) * 6}px`, ["--k" as string]: k }}>
            {done ? <MiniCard s={s} i={k} /> : <span className="cardback" aria-hidden="true">{k === current && <span>{k + 1}</span>}</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** The rest of the day, peeking at the bottom of the screen. */
export function Deck({ left }: { left: number }) {
  return (
    <div className="deck" role="img" aria-label={left ? `${left} ${left === 1 ? "card" : "cards"} left in the deck` : "The last card of the day"}>
      <div className="stack" aria-hidden="true">{Array.from({ length: Math.max(1, Math.min(left, 4)) }, (_, k) => <i key={k} className="cardback" style={{ ["--k" as string]: k }} />)}</div>
      <span className="deck-left" aria-hidden="true">{left ? `${left} left` : "Last card"}</span>
    </div>
  );
}

export function CrowdBars({ crowd, spot }: { crowd: NonNullable<StopData["reveal"]>["crowd"]; spot: string }) {
  const label = crowd.source === "live" ? `How far ${crowd.players} players got` : "How far players usually get (editor's estimate until enough people have played)";
  return (
    <div className="bars"><p className="small">{label}</p>
      <ul aria-label={label}>
        {["Country", "City", spot].map((l, k) => (
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
