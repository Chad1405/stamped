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
import { ThemeMenu } from "./ThemeMenu";

// the official accounts' logos, from Simple Icons (CC0), drawn in the footer's own colour
const TIKTOK = "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z";
const INSTAGRAM = "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077";
const Logo = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d={d} fill="currentColor" /></svg>;

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
    // where a new player came from: a tagged link (?src=tiktok) or the site that linked here; the server keeps only the first, on new players
    const from = document.referrer ? new URL(document.referrer).hostname : "";
    const src = q.get("src") ?? q.get("utm_source") ?? (from && from !== location.hostname ? from : null);
    if (join) setInvite(join.toUpperCase());
    if (join || pass || q.has("src") || q.has("utm_source")) history.replaceState(null, "", location.pathname);   // back from Checkout, an invite or a tagged link: a clean address to share
    void load().then(() => {
      if (src) api.source(src).catch(() => {});
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
        <Link className="mark" href="/" aria-label="Born There, back to today's flight" onClick={e => { e.preventDefault(); if (!playing) void load(); }}>Born There<span className="mark-url" aria-hidden="true">bornthere.app</span></Link>
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
          <ThemeMenu />
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
          <p>Born There is a free daily geography game: five photos from real places, the same for everyone. Guess the country from the photo, then risk it for the city.</p>
          <p>Each photo is credited with its answer, once you have played that stop.</p>
          <nav aria-label="About"><Link href="/how-to-play">How to play</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a className="social" href={SITE.social.tiktok} target="_blank" rel="noopener me" aria-label="Born There on TikTok" title="TikTok"><Logo d={TIKTOK} /></a><a className="social" href={SITE.social.instagram} target="_blank" rel="noopener me" aria-label="Born There on Instagram" title="Instagram"><Logo d={INSTAGRAM} /></a></nav>
        </footer>
      )}
    </div>
  );
}
