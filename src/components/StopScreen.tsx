"use client";
// One stop: the clue, the clock, the depth ladder, and the guess or the risk choice. Every move goes to the server.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api, ApiError, type ActResult, type Day, type StopData } from "@/lib/client/api";
import { COUNTRIES } from "@/lib/game/match";
import { ROUND_MS, TIERS } from "@/lib/game/rules";
import { confetti, sfx, shake, toTop } from "@/lib/client/fx";
import { CrowdBars, EntryStamp, Strip, useReplay } from "./bits";

type Props = { day: Day; idx: number; offset: number; onResult: (r: ActResult) => void; onNext: () => void; onError: (m: string) => void };
const COUNTRY_NAMES = COUNTRIES.map(c => c.name);

/** The text-message clue as a chat thread: they type, the message lands; once the stop is played your answer goes back. */
function Chat({ p, reply }: { p: NonNullable<StopData["postcard"]>; reply?: string }) {
  const time = p.note.split(", ").at(-1) ?? "";
  return (
    <div className="chat" role="group" aria-label={p.from ? `${p.note}, from a number starting ${p.from.replace(/[ •]+$/, "").replace(/ •.*$/, "")}` : p.note}>
      <div className="chat-head" aria-hidden="true"><span className="avatar">?</span><div><strong className="chat-from">{p.from ?? "Unknown number"}</strong><span>Mobile</span></div></div>
      <div className="chat-body">
        <p className="chat-day">Today {time}</p>
        <div className="typing" aria-hidden="true"><i /><i /><i /></div>
        <p className="bubble bubble--in" lang={p.lang ?? "en"}>{p.text}<span className="b-time">{time}</span></p>
        {reply && <><p className="bubble bubble--out">See you in {reply}!</p><span className="chat-status">Delivered</span></>}
      </div>
      <div className="chat-bar" aria-hidden="true"><span>Message</span><b>↑</b></div>
    </div>
  );
}

function Frame({ s, overlay, caption, reply }: { s: StopData; overlay?: React.ReactNode; caption: React.ReactNode; reply?: string }) {
  return (
    <figure className="frame">
      <div className="pane">
        {s.postcard
          ? <Chat p={s.postcard} reply={reply} />
          // eslint-disable-next-line @next/next/no-img-element -- clue photos are fixed-size local files; next/image adds nothing here
          : <img src={s.img!} alt={s.alt ?? ""} width={960} height={720} />}
        {overlay}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Ladder({ s }: { s: StopData }) {
  const order = ["country", "city", "spot"] as const, at = order.indexOf(s.state.phase === "decide" ? s.state.next! : s.state.step);
  const steps: [string, number][] = [["Country", 30], ["City", 85], ["Exact spot", 100]];
  return (
    <div className="ladder">
    <div className="alt" aria-hidden="true"><span className="alt-plane" style={{ ["--at" as string]: Math.min(at, 2) }}><Plane /></span></div>
    <ol className="route" aria-label="How deep you are">
      {steps.map(([label, pts], k) => {
        const state = k < at ? "is-done" : k === at && s.state.phase === "input" ? "is-live" : "";
        const just = s.state.phase === "decide" && k === at - 1;
        return <li key={label} className={`${state}${just ? " is-just" : ""}`} data-gain={just ? `+${pts}` : undefined} aria-current={state === "is-live" ? "step" : undefined}><span>{label}</span><span>{pts}</span></li>;
      })}
    </ol>
    </div>
  );
}

export function Plane() {
  return <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)" /></svg>;
}

export function StopScreen({ day, idx, offset, onResult, onNext, onError }: Props) {
  const s = day.stops[idx], st = s.state;
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState<{ text: string; warn: boolean } | null>(null);
  const [now, setNow] = useState(() => Date.now() + offset);
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState<number | null>(null);
  const sentTimeout = useRef(false);
  const rowRef = useReplay<HTMLDivElement>("shake", shakeKey);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = useCallback(async (action: Parameters<typeof api.play>[2]) => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.play(day.date, idx, action);
      onResult(r);
      const ev = r.event;
      if (ev.kind === "rejected") sfx("reject");
      else if (ev.kind === "right") { sfx("correct"); const el = document.querySelector(".route li.is-live")?.getBoundingClientRect(); if (el) confetti({ x: el.left + el.width / 2, y: el.top }, 28); }
      else if (ev.kind === "advanced") sfx("deeper");
      else if (ev.kind === "finished") { if (action.type === "decide") sfx("bank"); if (ev.tier === "native") setTimeout(() => { sfx("top"); confetti(); }, 320); else if (ev.tier === "miss" || ev.tier === "lost") setTimeout(() => sfx("miss"), 320); }
      if (r.event.kind === "correction") { setDraft(r.event.suggestion); setMsg({ text: `Did you mean ${r.event.suggestion}? Press Enter to confirm.`, warn: false }); }
      else if (r.event.kind === "rejected") { setMsg({ text: r.event.message, warn: true }); setShakeKey(k => (k ?? 0) + 1); }
      else { setMsg(null); setDraft(""); }
    } catch (e) { onError(e instanceof ApiError ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }, [busy, day.date, idx, onResult, onError]);

  // the clock: server deadline, shown in local time via the measured offset
  useEffect(() => { if (st.phase !== "input") return; const t = setInterval(() => setNow(Date.now() + offset), 100); return () => clearInterval(t); }, [st.phase, offset]);
  useEffect(() => { sentTimeout.current = false; }, [st.step, st.phase, idx]);
  const preview = st.phase === "input" && st.step === "country" && st.endsAt !== null && now < st.endsAt - ROUND_MS;
  const remaining = st.endsAt === null ? ROUND_MS : Math.max(0, Math.min(ROUND_MS, st.endsAt - now));
  useEffect(() => {
    if (st.phase === "input" && st.endsAt !== null && now >= st.endsAt && !sentTimeout.current) { sentTimeout.current = true; void send({ type: "timeout", text: draft.trim() || undefined }); }
  }, [now, st.phase, st.endsAt, draft, send]);
  useEffect(() => { if (st.phase === "input" && !preview) inputRef.current?.focus({ preventScroll: true }); }, [st.phase, st.step, preview]);   // focusing must not drag the page away from the clue
  const countN = preview && st.endsAt !== null ? Math.max(1, Math.ceil((st.endsAt - ROUND_MS - now) / 1000)) : 0;
  const secsLeft = st.phase === "input" && !preview ? Math.ceil(remaining / 1000) : null;
  const wasPreview = useRef(preview);
  useEffect(() => { if (countN) sfx("count"); }, [countN]);
  useEffect(() => { if (wasPreview.current && !preview && st.phase === "input") sfx("go"); wasPreview.current = preview; }, [preview, st.phase]);
  useEffect(() => { if (secsLeft !== null && secsLeft > 0 && secsLeft <= 5) sfx("tick"); }, [secsLeft]);
  // the stamp lands: a thud and a jolt, timed to the slam
  const stopRef = useRef<HTMLElement>(null), landed = st.phase === "done";
  const nextRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => { if (landed) { toTop(); nextRef.current?.focus({ preventScroll: true }); } }, [landed]);   // the reveal opens at the top too
  useEffect(() => { if (!landed) return; const t = setTimeout(() => { sfx("stamp"); shake(stopRef.current); }, 280); return () => clearTimeout(t); }, [landed]);
  // D and B answer the risk choice
  useEffect(() => {
    if (st.phase !== "decide") return;
    const onKey = (e: KeyboardEvent) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toLowerCase(); if (k === "d") void send({ type: "decide", deeper: true }); if (k === "b") void send({ type: "decide", deeper: false }); };
    addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey);
  }, [st.phase, send]);

  const caption = `Stop ${idx + 1} of ${day.stops.length}: ${s.type.toLowerCase()}`;

  if (st.phase === "done" && s.reveal) {
    const r = s.reveal, t = TIERS[st.tier!], last = idx === day.stops.length - 1;
    return (
      <div className="play">
        <Strip stops={day.stops} current={idx} total={day.score} />
        <section className="stop" ref={stopRef}>
          <Frame s={s} reply={r.cityName} overlay={s.postcard ? undefined : <div className="over plate"><span className="figure flap" aria-label={r.airport}>{[...r.airport].map((ch, k) => <span key={k} aria-hidden="true" style={{ ["--k" as string]: k }}>{ch}</span>)}</span><span>{r.cityName}</span></div>}
            caption={<>{caption}.{r.credit && <> Photo: <a href={r.credit.url} target="_blank" rel="noopener">{r.credit.title}</a> by {r.credit.author} ({r.credit.license}), resized.</>}</>} />
          <div className="panel">
            <div className="result-head">
              <EntryStamp s={s} i={idx} date={day.date} motion="slam" />
              {t.score > 0 && <span className="gain" aria-hidden="true">+{t.score}</span>}
              <div><h1>{r.cityName}, {r.country}</h1><p className="small">{st.note}</p></div>
            </div>
            <dl className="facts">
              <dt>Region</dt><dd>{r.regionName}</dd><dt>Exact spot</dt><dd>{r.spotName}</dd><dt>Nearest airport</dt><dd>{r.airport}</dd>
              {st.guesses.length > 0 && <><dt>Your route</dt><dd>{st.guesses.join(", then ")}</dd></>}
            </dl>
            <p>{r.fact}</p>
            <CrowdBars crowd={r.crowd} />
            <div className="actions"><button className="btn btn--primary" type="button" onClick={onNext} ref={nextRef}>{last ? "Open your passport" : `Board stop ${idx + 2}`}</button></div>
          </div>
        </section>
      </div>
    );
  }

  const question = st.step === "country" ? s.prompt : st.step === "city" ? "Which city?" : `${s.spotLabel}.`;
  const label = st.step === "country" ? "Country" : st.step === "city" ? "City" : "Exact spot";
  const nextScore = st.next === "city" ? TIERS.local.score : TIERS.native.score, dropScore = st.next === "city" ? TIERS.lost.score : TIERS.traveller.score;
  const secs = Math.ceil(remaining / 1000);
  return (
    <div className="play">
      <Strip stops={day.stops} current={idx} total={day.score} />
      <section className="stop">
        <Frame s={s} caption={caption} overlay={preview && st.endsAt !== null ? (
          <div className={`count${s.postcard ? " count--chat" : ""}`} aria-live="off"><div><div className="count-dial"><svg viewBox="0 0 120 120" aria-hidden="true"><circle className="ring-track" cx="60" cy="60" r="54" /><circle className="ring" key={countN} cx="60" cy="60" r="54" /></svg><span className="count-n" key={countN}>{countN}</span></div><span className="count-label">Typing opens in</span></div></div>) : null} />
        <div className="panel">
          <div className="clockline">
            <h1>{question}</h1>
            <div className={`clock plate${st.phase === "input" && !preview && remaining < 8000 ? " is-low" : ""}`} role="timer" aria-label={st.phase === "decide" ? "Clock stopped while you decide" : "Time left"}>
              <span>{st.phase === "decide" ? "Clock stopped" : "Time left"}</span>
              <span className="figure">0:{String(st.phase === "input" && !preview ? secs : ROUND_MS / 1000).padStart(2, "0")}</span>
              <span className="fuse" aria-hidden="true"><span style={{ transform: `scaleX(${st.phase === "input" && !preview ? remaining / ROUND_MS : 1})` }} /></span>
            </div>
          </div>
          <Ladder s={s} />
          {preview && <p className="help">Look first. Typing opens when the clock starts.</p>}
          {st.phase === "input" && !preview && (
            <form className="field" autoComplete="off" noValidate onSubmit={e => { e.preventDefault(); if (draft.trim()) void send({ type: "guess", text: draft }); }}>
              <label htmlFor="guess">{label}</label>
              <div className="entry-row" ref={rowRef}>
                <input ref={inputRef} className="input" type="text" id="guess" name="guess" value={draft} onChange={e => setDraft(e.target.value)} maxLength={80}
                  list={st.step === "country" ? "countries" : st.step === "city" ? "cities" : undefined} autoCapitalize="words" spellCheck={false}
                  aria-describedby="msg" aria-invalid={msg?.warn || undefined} disabled={busy} />
                <button className="btn btn--primary" type="submit" disabled={busy}>Stamp it</button>
              </div>
              <p className={`help${msg?.warn ? " is-error" : ""}`} id="msg" role="status">{msg?.text}</p>
              {st.step === "country" && <datalist id="countries">{COUNTRY_NAMES.map(c => <option key={c} value={c} />)}</datalist>}
              {st.step === "city" && <datalist id="cities">{s.cities.map(c => <option key={c} value={c} />)}</datalist>}
            </form>
          )}
          {st.phase === "decide" && (
            <>
              <p className="right">{st.guesses.at(-1)} is right. Risk it, or bank it?</p>
              <div className="choices">
                <button className="choice choice--risk" type="button" aria-keyshortcuts="D" disabled={busy} onClick={() => send({ type: "decide", deeper: true })}>
                  <span className="c-key" aria-hidden="true">D</span><span className="c-title">Go deeper</span><span className="c-pts">{nextScore}</span>
                  <span className="c-odds">Name {st.next === "city" ? "the city" : "the exact spot"}</span><span className="c-risk">Miss and you drop to {dropScore}</span>
                </button>
                <button className="choice" type="button" aria-keyshortcuts="B" disabled={busy} onClick={() => send({ type: "decide", deeper: false })}>
                  <span className="c-key" aria-hidden="true">B</span><span className="c-title">Bank it</span><span className="c-pts">{TIERS[st.banked!].score}</span>
                  <span className="c-odds">Take the {TIERS[st.banked!].name} stamp</span><span className="c-risk">Safe</span>
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
