"use client";
// One stop: the clue, the clock, the depth ladder, and the guess or the risk choice. Every move goes to the server.
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type ActResult, type Day, type StopData } from "@/lib/client/api";
import { COUNTRIES } from "@/lib/game/match";
import { ROUND_MS, TIERS } from "@/lib/game/rules";
import { CrowdBars, EntryStamp, Strip, useReplay } from "./bits";

type Props = { day: Day; idx: number; offset: number; onResult: (r: ActResult) => void; onNext: () => void; onError: (m: string) => void };
const COUNTRY_NAMES = COUNTRIES.map(c => c.name);

function Frame({ s, overlay, caption }: { s: StopData; overlay?: React.ReactNode; caption: React.ReactNode }) {
  return (
    <figure className="frame">
      <div className="pane">
        {s.postcard
          ? <div className="note-card"><blockquote lang={s.postcard.lang ?? "en"}>{s.postcard.text}</blockquote><p className="small">{s.postcard.note}</p></div>
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
    <ol className="route" aria-label="How deep you are">
      {steps.map(([label, pts], k) => {
        const state = k < at ? "is-done" : k === at && s.state.phase === "input" ? "is-live" : "";
        const just = s.state.phase === "decide" && k === at - 1;
        return <li key={label} className={`${state}${just ? " is-just" : ""}`} data-gain={just ? `+${pts}` : undefined} aria-current={state === "is-live" ? "step" : undefined}><span>{label}</span><span>{pts}</span></li>;
      })}
    </ol>
  );
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
  useEffect(() => { if (st.phase === "input" && !preview) inputRef.current?.focus(); }, [st.phase, st.step, preview]);
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
        <section className="stop">
          <Frame s={s} overlay={<div className="over plate"><span className="figure">{r.airport}</span><span>{r.cityName}</span></div>}
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
            <div className="actions"><button className="btn btn--primary" type="button" onClick={onNext} autoFocus>{last ? "Open your passport" : `Board stop ${idx + 2}`}</button></div>
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
          <div className="count"><div className="plate"><span>Typing opens in</span><span className="figure pop" key={Math.ceil((st.endsAt - ROUND_MS - now) / 1000)}>{Math.max(1, Math.ceil((st.endsAt - ROUND_MS - now) / 1000))}</span></div></div>) : null} />
        <div className="panel">
          <div className="clockline">
            <h1>{question}</h1>
            <div className={`clock plate${st.phase === "input" && !preview && remaining < 8000 ? " is-low" : ""}`} role="timer" aria-label={st.phase === "decide" ? "Clock stopped while you decide" : "Time left"}>
              <span>{st.phase === "decide" ? "Clock stopped" : "Time left"}</span>
              <span className="figure">0:{String(st.phase === "input" && !preview ? secs : ROUND_MS / 1000).padStart(2, "0")}</span>
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
