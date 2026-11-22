"use client";
// The app shell: loads the day and the player, routes between screens, and keeps the HUD current.
// Play happens on one card at a time, drawn from the deck at the bottom of the screen (see DESIGN.md).
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api, ApiError, type ActResult, type Day, type League, type Me } from "@/lib/client/api";
import { isMuted, setMuted, sfx, toTop } from "@/lib/client/fx";
import { SITE } from "@/lib/site";
import { CountUp, Deck } from "./bits";
import { Done, Friends, Home, Passport } from "./screens";
import { StopScreen } from "./StopScreen";

type View = "home" | "stop" | "done" | "passport" | "friends";
const scoreOf = (d: Day) => d.stops.reduce((n, s) => n + s.state.points, 0);
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
    const q = new URLSearchParams(location.search), join = q.get("join"), pass = q.get("pass");
    if (join) setInvite(join.toUpperCase());
    if (join || pass) history.replaceState(null, "", location.pathname);   // back from Checkout or an old sign-in link: the archive shows the pass
    void load().then(() => {
      if (join) { backTo.current = "home"; setView("friends"); }
      if (pass === "expired") setError("Sign-in links no longer work: sign-in now uses a 6-digit code. Ask for one under the archive.");
    });
  }, [load]);

  const merge = useCallback((r: ActResult) => {
    setOffset(r.serverNow - Date.now());
    setDay(d => { if (!d) return d; const stops = d.stops.map(s => s.stop === r.stop.stop ? r.stop : s); const next = { ...d, stops, field: r.field ?? d.field }; return { ...next, score: scoreOf(next) }; });
    if (r.dayDone || r.event.kind === "finished") void refreshPlayer();
  }, [refreshPlayer]);

  // drawing a card starts its stop on the server; the 3 s look-first preview covers the draw
  const startStop = useCallback(async (d: Day, i: number) => {
    setIdx(i); setView("stop");
    if (d.stops[i].state.phase === "ready") {
      try { merge(await api.play(d.date, i, { type: "start" })); }
      catch (e) { setError(e instanceof ApiError ? e.message : "Could not start the stop."); }
    }
  }, [merge]);
  const board = () => { if (!day) return; sfx("board"); const i = day.stops.findIndex(s => s.state.phase !== "done"); if (i < 0) setView("done"); else void startStop(day, i); };
  const next = () => { if (!day) return; if (idx >= day.stops.length - 1) setView("done"); else { sfx("takeoff"); void startStop(day, idx + 1); } };
  const open = (v: View) => { backTo.current = view; setView(v); };
  const back = () => setView(backTo.current === "stop" || !day ? (day && allDone(day) ? "done" : "home") : backTo.current);
  const playing = view === "stop" && !!day && ["input", "decide"].includes(day.stops[idx]?.state.phase);

  // load the next clue photos ahead of time, so the card never turns over onto a grey box
  useEffect(() => {
    if (!day) return;
    const at = view === "stop" ? idx : day.stops.findIndex(s => s.state.phase !== "done");
    if (at >= 0) for (const s of day.stops.slice(at, at + 2)) if (s.img) new Image().src = s.img;
  }, [day, view, idx]);

  // every screen change starts at the top: one place, after the new screen is in the DOM, so no route can miss it
  const scene = `${view}-${view === "stop" ? idx : day?.date}`;
  useLayoutEffect(toTop, [scene]);

  const hudScore = day?.score ?? 0, fromScore = shownScore.current;
  useEffect(() => { shownScore.current = hudScore; }, [hudScore]);
  const stopNo = day ? (view === "done" ? day.stops.length : Math.min(day.stops.length, (view === "stop" ? idx : day.stops.filter(s => s.state.phase === "done").length) + (view === "stop" ? 1 : 0))) : 0;

  return (
    <div className={`shell${playing ? " is-playing" : ""}${view === "passport" || view === "friends" ? " is-wide" : ""}`}>
      <header className="bar">
        <Link className="mark" href="/" aria-label="Born There, back to today's flight" onClick={e => { e.preventDefault(); if (!playing) void load(); }}>Born There</Link>
        <dl className="hud">
          <div className="hud-stop"><dt>Stop</dt><dd>{stopNo}/{day?.stops.length ?? 5}</dd></div>
          <div className="hud-score"><dt>Score</dt><dd key={hudScore} className={hudScore > fromScore ? "bumping" : undefined}><CountUp from={fromScore} to={hudScore} /></dd></div>
          <div className="hud-streak"><dt>Streak</dt><dd>{me?.streak.n ?? 0}</dd></div>
        </dl>
        <nav className="bar-nav" aria-label="Your progress">
          <button className="btn btn--icon" type="button" aria-pressed={!muted} aria-label={muted ? "Sound off" : "Sound on"} title={muted ? "Turn sound on" : "Turn sound off"}
            onClick={() => { setMuted(!muted); setMute(!muted); if (muted) sfx("correct"); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z" />{muted ? <path d="M16 9l5 6m0-6l-5 6" stroke="currentColor" strokeWidth="2" /> : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" />}</svg>
          </button>
          <button className="btn btn--small" type="button" aria-current={view === "friends" ? "page" : undefined} disabled={playing || !me} onClick={() => { if (view !== "friends") open("friends"); }}>Friends</button>
          <button className="btn btn--small" type="button" aria-current={view === "passport" ? "page" : undefined} disabled={playing || !me} onClick={() => { if (view !== "passport") open("passport"); }}>Passport</button>
        </nav>
      </header>
      <main aria-live="polite">
        {error && <p className="help is-error" role="alert">{error} <button className="linkish" type="button" onClick={() => void load(day?.date)}>Try again</button></p>}
        {/* the server HTML is this loading state, so it carries the page heading; each view brings its own h1 once the day loads */}
        {!day && <h1 className="visually-hidden">{SITE.name}: {SITE.tagline}</h1>}
        {!day && !error && <p className="small">Checking in for today’s flight…</p>}
        <div className="scene" key={scene}>
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
        </div>
        {day && view === "stop" && <Deck left={day.stops.length - idx - 1} />}
      </main>
      {!playing && (
        <footer>
          <p>Born There is a free daily geography game: five photos from real places, the same for everyone. Name the country, then risk it for the city.</p>
          <p>Each photo is credited with its answer, once you have played that stop.</p>
          <nav aria-label="About"><Link href="/how-to-play">How to play</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
        </footer>
      )}
    </div>
  );
}
