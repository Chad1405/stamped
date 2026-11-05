"use client";
// The app shell: loads the day and the player, routes between screens, and keeps the HUD current.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type ActResult, type Day, type League, type Me } from "@/lib/client/api";
import { TIERS } from "@/lib/game/rules";
import { CountUp } from "./bits";
import { Done, Friends, Home, Passport } from "./screens";
import { StopScreen } from "./StopScreen";

type View = "home" | "stop" | "done" | "passport" | "friends";
const scoreOf = (d: Day) => d.stops.reduce((n, s) => n + (s.state.tier ? TIERS[s.state.tier].score : 0), 0);
const allDone = (d: Day) => d.stops.every(s => s.state.phase === "done");

export default function Game() {
  const [day, setDay] = useState<Day | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [view, setView] = useState<View>("home");
  const [idx, setIdx] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState("");
  const backTo = useRef<View>("home");
  const shownScore = useRef(0);

  const refreshPlayer = useCallback(async () => {
    const [m, l] = await Promise.all([api.me(), api.leagues()]);
    setMe(m); setLeagues(l);
  }, []);

  const load = useCallback(async (date?: string) => {
    try {
      setError(null);
      const d = await api.day(date);
      setOffset(d.serverNow - Date.now()); setDay(d); shownScore.current = d.score;
      setView(allDone(d) ? "done" : "home");
      await refreshPlayer();
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not load the flight."); }
  }, [refreshPlayer]);

  useEffect(() => {
    const join = new URLSearchParams(location.search).get("join");
    if (join) { setInvite(join.toUpperCase()); history.replaceState(null, "", location.pathname); }
    void load().then(() => { if (join) { backTo.current = "home"; setView("friends"); } });
  }, [load]);

  const merge = useCallback((r: ActResult) => {
    setOffset(r.serverNow - Date.now());
    setDay(d => { if (!d) return d; const stops = d.stops.map(s => s.stop === r.stop.stop ? r.stop : s); const next = { ...d, stops }; return { ...next, score: scoreOf(next) }; });
    if (r.dayDone || r.event.kind === "finished") void refreshPlayer();
  }, [refreshPlayer]);

  const startStop = useCallback(async (d: Day, i: number) => {
    setIdx(i); setView("stop"); scrollTo(0, 0);
    if (d.stops[i].state.phase === "ready") {
      try { merge(await api.play(d.date, i, { type: "start" })); }
      catch (e) { setError(e instanceof ApiError ? e.message : "Could not start the stop."); }
    }
  }, [merge]);

  const board = () => { if (!day) return; const i = day.stops.findIndex(s => s.state.phase !== "done"); if (i < 0) setView("done"); else void startStop(day, i); };
  const next = () => { if (!day) return; if (idx >= day.stops.length - 1) { setView("done"); scrollTo(0, 0); } else void startStop(day, idx + 1); };
  const open = (v: View) => { backTo.current = view; setView(v); scrollTo(0, 0); };
  const back = () => setView(backTo.current === "stop" || !day ? (day && allDone(day) ? "done" : "home") : backTo.current);
  const playing = view === "stop" && !!day && ["input", "decide"].includes(day.stops[idx]?.state.phase);

  const hudScore = day?.score ?? 0, fromScore = shownScore.current;
  useEffect(() => { shownScore.current = hudScore; }, [hudScore]);

  return (
    <div className="shell">
      <header className="bar">
        <Link className="mark" href="/" aria-label="Stamped, back to today's flight" onClick={e => { e.preventDefault(); if (!playing) void load(); }}>
          <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" /><ellipse cx="16" cy="16" rx="5.5" ry="13" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 16h26" stroke="currentColor" strokeWidth="2" /></svg>
          Stamped
        </Link>
        <div className="bar-right">
          <nav className="bar-nav" aria-label="Your progress">
            <button className="btn btn--small" type="button" disabled={playing || view === "friends" || !me} onClick={() => open("friends")}>Friends</button>
            <button className="btn btn--small" type="button" disabled={playing || view === "passport" || !me} onClick={() => open("passport")}><span className="wide-only">My </span>passport</button>
          </nav>
          <dl className="hud">
            <div><dt>Stop</dt><dd>{day ? `${view === "done" ? day.stops.length : Math.min(day.stops.length, (view === "stop" ? idx : day.stops.filter(s => s.state.phase === "done").length) + (view === "stop" ? 1 : 0))}/${day.stops.length}` : "0/5"}</dd></div>
            <div className="hud-score"><dt>Score</dt><dd key={hudScore} className={hudScore > fromScore ? "bumping" : undefined}><CountUp from={fromScore} to={hudScore} /></dd></div>
            <div className="hud-streak"><dt>Streak</dt><dd>{me?.streak.n ?? 0}</dd></div>
          </dl>
        </div>
      </header>
      <main aria-live="polite">
        {error && <p className="help is-error" role="alert">{error} <button className="linkish" type="button" onClick={() => void load(day?.date)}>Try again</button></p>}
        {!day && !error && <p className="small">Loading today’s flight…</p>}
        {day && view === "home" && <Home day={day} me={me} leagues={leagues} onBoard={board} onOpenDay={d => void load(d)} onFriends={() => open("friends")} />}
        {day && view === "stop" && <StopScreen key={`${day.date}-${idx}`} day={day} idx={idx} offset={offset} onResult={merge} onNext={next} onError={setError} />}
        {day && view === "done" && <Done day={day} me={me} onPassport={() => open("passport")} onFriends={() => open("friends")} onOpenDay={d => void load(d)} />}
        {me && view === "passport" && <Passport me={me} onBack={back} />}
        {me && view === "friends" && (
          <Friends me={me} leagues={leagues} inviteCode={invite} onBack={back}
            onRename={async n => { setMe(await api.rename(n)); setLeagues(await api.leagues()); }}
            onCreate={async n => { try { setLeagues((await api.createLeague(n)).leagues); return null; } catch (e) { return e instanceof ApiError ? e.message : "Could not create the league."; } }}
            onJoin={async c => { try { setLeagues((await api.joinLeague(c)).leagues); setInvite(""); return null; } catch (e) { return e instanceof ApiError ? e.message : "Could not join."; } }}
            onLeave={async id => setLeagues(await api.leaveLeague(id))} />
        )}
      </main>
      <footer>
        <p>Each photo is credited with its answer, once you have played that stop.</p>
      </footer>
    </div>
  );
}
