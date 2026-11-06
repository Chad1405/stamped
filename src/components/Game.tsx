"use client";
// The app shell: loads the day and the player, routes between screens, and keeps the HUD current.
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api, ApiError, type ActResult, type Day, type League, type Me } from "@/lib/client/api";
import { legFlown, TIERS } from "@/lib/game/rules";
import { isMuted, reducedMotion, setMuted, sfx, toTop } from "@/lib/client/fx";
import { FlightBand } from "./Flight";
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
  const [flight, setFlight] = useState<{ from: number; to: number } | null>(null);   // a leg in the air: the next stop's clock starts on landing
  const [muted, setMute] = useState(false);
  useEffect(() => setMute(isMuted()), []);
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
    setIdx(i); setView("stop");
    if (d.stops[i].state.phase === "ready") {
      try { merge(await api.play(d.date, i, { type: "start" })); }
      catch (e) { setError(e instanceof ApiError ? e.message : "Could not start the stop."); }
    }
  }, [merge]);

  // boarding a stop flies the leg first; a stop already under way (a reload) or reduced motion goes straight there
  const takeOff = (d: Day, to: number, from: number) => {
    if (reducedMotion() || d.stops[to].state.phase !== "ready") { void startStop(d, to); return; }
    setIdx(to); setView("stop"); setFlight({ from, to });
  };
  const arrive = () => { const f = flight; setFlight(null); if (f && day) void startStop(day, f.to); };
  const board = () => { if (!day) return; sfx("board"); const i = day.stops.findIndex(s => s.state.phase !== "done"); if (i < 0) setView("done"); else takeOff(day, i, i - 1); };
  const next = () => { if (!day) return; if (idx >= day.stops.length - 1) setView("done"); else takeOff(day, idx + 1, idx); };
  const flownKm = day ? day.stops.reduce((n, s) => n + (legFlown(s.state.tier) ? s.reveal?.leg?.km ?? 0 : 0), 0) : 0;
  const open = (v: View) => { backTo.current = view; setView(v); };
  const back = () => setView(backTo.current === "stop" || !day ? (day && allDone(day) ? "done" : "home") : backTo.current);
  const playing = view === "stop" && !!day && (!!flight || ["input", "decide"].includes(day.stops[idx]?.state.phase));

  // every screen change starts at the top: one place, after the new screen is in the DOM, so no route can miss it
  const scene = `${view}-${view === "stop" ? idx : day?.date}`;
  useLayoutEffect(toTop, [scene]);

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
            <button className="btn btn--small btn--icon" type="button" aria-pressed={!muted} aria-label={muted ? "Sound off" : "Sound on"} title={muted ? "Turn sound on" : "Turn sound off"}
              onClick={() => { setMuted(!muted); setMute(!muted); if (muted) sfx("correct"); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z" />{muted ? <path d="M16 9l5 6m0-6l-5 6" stroke="currentColor" strokeWidth="2" /> : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" />}</svg>
            </button>
            <button className="btn btn--small" type="button" disabled={playing || view === "friends" || !me} onClick={() => open("friends")}>Friends</button>
            <button className="btn btn--small" type="button" disabled={playing || view === "passport" || !me} onClick={() => open("passport")}><span className="wide-only">My </span>passport</button>
          </nav>
          <dl className="hud">
            <div><dt>Stop</dt><dd>{day ? `${view === "done" ? day.stops.length : Math.min(day.stops.length, (view === "stop" ? idx : day.stops.filter(s => s.state.phase === "done").length) + (view === "stop" ? 1 : 0))}/${day.stops.length}` : "0/5"}</dd></div>
            <div className="hud-score"><dt>Score</dt><dd key={hudScore} className={hudScore > fromScore ? "bumping" : undefined}><CountUp from={fromScore} to={hudScore} /></dd></div>
            <div className="hud-streak"><dt>Streak</dt><dd key={me?.streak.n ?? 0} className="bumping">{me?.streak.n ?? 0}</dd></div>
          </dl>
        </div>
      </header>
      <div className="sky" aria-hidden="true"><i /><i /><i /><b /></div>
      <main aria-live="polite">
        {error && <p className="help is-error" role="alert">{error} <button className="linkish" type="button" onClick={() => void load(day?.date)}>Try again</button></p>}
        {!day && !error && <p className="small">Loading today’s flight…</p>}
        {day && view === "stop" && <FlightBand stops={day.stops} at={idx} flight={flight} flownKm={flownKm} onArrive={arrive} />}
        <div className="scene" key={scene}>
        {day && view === "home" && <Home day={day} me={me} leagues={leagues} onBoard={board} onOpenDay={d => void load(d)} onFriends={() => open("friends")} />}
        {day && view === "stop" && flight && (
          <section className="arriving"><span className="small">Next stop</span><h1>Stop {flight.to + 1}: {day.stops[flight.to].type}</h1><p className="lead">Destination unknown. The clue opens as you land.</p></section>
        )}
        {day && view === "stop" && !flight && <StopScreen key={`${day.date}-${idx}`} day={day} idx={idx} offset={offset} onResult={merge} onNext={next} onError={setError} />}
        {day && view === "done" && <Done day={day} me={me} onPassport={() => open("passport")} onFriends={() => open("friends")} onOpenDay={d => void load(d)} />}
        {me && view === "passport" && <Passport me={me} onBack={back} />}
        {me && view === "friends" && (
          <Friends me={me} leagues={leagues} inviteCode={invite} onBack={back}
            onRename={async n => { setMe(await api.rename(n)); setLeagues(await api.leagues()); }}
            onCreate={async n => { try { setLeagues((await api.createLeague(n)).leagues); return null; } catch (e) { return e instanceof ApiError ? e.message : "Could not create the league."; } }}
            onJoin={async c => { try { setLeagues((await api.joinLeague(c)).leagues); setInvite(""); return null; } catch (e) { return e instanceof ApiError ? e.message : "Could not join."; } }}
            onLeave={async id => setLeagues(await api.leaveLeague(id))} />
        )}
        </div>
      </main>
      <footer>
        <p>Each photo is credited with its answer, once you have played that stop.</p>
      </footer>
    </div>
  );
}
