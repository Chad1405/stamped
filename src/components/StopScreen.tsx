"use client";
// One stop: the clue, the clock, the depth ladder, and the guess or the risk choice. Every move goes to the server.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api, ApiError, type ActResult, type Day, type StopData } from "@/lib/client/api";
import { COUNTRIES, norm } from "@/lib/game/match";
import { ROUND_MS, TIERS } from "@/lib/game/rules";
import { reducedMotion, sfx, shake, toTop } from "@/lib/client/fx";
import { legFlown } from "@/lib/game/rules";

// as measured on Krillion: the question leaves in 650 ms, and the top answer turns gold about a second after it lands
const DEPART_MS = 650, GOLD_MS = 1100;
type Weight = "miss" | "light" | "big" | "top";
const weightOf = (tier: string | null): Weight | null => !tier ? null : tier === "miss" ? "miss" : tier === "tourist" || tier === "lost" ? "light" : tier === "native" ? "top" : "big";
import { CrowdBars, EntryStamp, useReplay } from "./bits";
import { DESCENT_MS } from "./Flight";

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
        <p className="bubble bubble--in" lang={p.lang ?? "en"} dir="auto">{p.text}<span className="b-time">{time}</span></p>
        {reply && <><p className="bubble bubble--out">See you in {reply}!</p><span className="chat-status">Delivered</span></>}
      </div>
      <div className="chat-bar" aria-hidden="true"><span>Message</span><b>↑</b></div>
    </div>
  );
}

function Frame({ s, overlay, caption, reply }: { s: StopData; overlay?: React.ReactNode; caption: React.ReactNode; reply?: string }) {
  return (
    <figure className="frame" id="clue">
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

/** The answer box with its own suggestion list (a combobox): the browser's <datalist> shows nothing on many phones and in-app browsers. */
/** On a phone, tapping the box opens the keyboard over half the screen: line the clue up with the top so the photo and the box are both in view. (On tap, not on focus: the game focuses the box itself when typing opens, with no keyboard.) */
function keepClueInView() {
  if (!matchMedia("(max-width: 40rem)").matches) return;
  setTimeout(() => document.getElementById("clue")?.scrollIntoView({ block: "start", behavior: "instant" }), 320);   // after the keyboard has opened
}

function SuggestInput({ inputRef, value, onChange, options, openOnFocus, disabled, invalid }: {
  inputRef: React.RefObject<HTMLInputElement | null>; value: string; onChange: (v: string) => void; options: string[]; openOnFocus: boolean; disabled: boolean; invalid: boolean;
}) {
  const [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  const q = norm(value);
  const matches = !q ? (openOnFocus ? options : [])
    : [...options.filter(o => norm(o).startsWith(q)), ...options.filter(o => !norm(o).startsWith(q) && norm(o).includes(q))];
  const shown = open && matches.length > 0 && !matches.some(o => norm(o) === q) ? matches.slice(0, 40) : [];
  const pick = (o: string) => { onChange(o); setOpen(false); setActive(-1); };
  return (
    <div className="suggest">
      <input ref={inputRef} className="input" type="text" id="guess" name="guess" value={value} maxLength={80} autoCapitalize="words" autoComplete="off" spellCheck={false}
        role="combobox" aria-autocomplete="list" aria-expanded={shown.length > 0} aria-controls="guess-list" aria-activedescendant={active >= 0 && shown[active] ? `guess-opt-${active}` : undefined}
        aria-describedby="msg" aria-invalid={invalid || undefined} readOnly={disabled} aria-busy={disabled || undefined}   // read-only, not disabled, while a guess is checked: a disabled box drops keyboard focus
        onChange={e => { onChange(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onClick={() => { setOpen(true); keepClueInView(); }} onBlur={() => setOpen(false)}
        onKeyDown={e => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpen(true); const n = shown.length || matches.length; if (n) setActive(a => (a + (e.key === "ArrowDown" ? 1 : n - 1)) % n); }
          else if (e.key === "Enter" && active >= 0 && shown[active]) { e.preventDefault(); pick(shown[active]); }   // Enter on a highlighted name fills it in; otherwise it submits
          else if (e.key === "Escape") { setOpen(false); setActive(-1); }
        }} />
      {shown.length > 0 && (
        <ul className="suggest-list" id="guess-list" role="listbox" aria-label="Suggestions">
          {shown.map((o, k) => (
            <li key={o} id={`guess-opt-${k}`} role="option" aria-selected={k === active} className={k === active ? "is-active" : undefined}
              onMouseDown={e => e.preventDefault()} onClick={() => pick(o)}>{o}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Ladder({ s }: { s: StopData }) {
  const order = ["country", "city", "spot"] as const, at = order.indexOf(s.state.phase === "decide" ? s.state.next! : s.state.step);
  const steps: [string, number][] = [["Country", 30], ["City", 85], ["Exact spot", 100]];
  return (
    <div className="ladder">
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


export function StopScreen({ day, idx, offset, onResult, onNext, onError }: Props) {
  const s = day.stops[idx], st = s.state;
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState<{ text: string; warn: boolean } | null>(null);
  const [now, setNow] = useState(() => Date.now() + offset);
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState<number | null>(null);
  const [departing, setDeparting] = useState(false), [gold, setGold] = useState(false);
  const sentTimeout = useRef(false);
  const rowRef = useReplay<HTMLDivElement>("shake", shakeKey);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = useCallback(async (action: Parameters<typeof api.play>[2]) => {
    if (busy) return;
    setBusy(true);
    const t0 = performance.now();
    if (action.type === "guess") sfx("submit");
    try {
      const r = await api.play(day.date, idx, action);
      const ev = r.event;
      // a guess that moves the stop on: the question leaves first, then the next screen arrives; a bounced guess stays put
      if ((ev.kind === "right" || ev.kind === "finished" || ev.kind === "advanced") && !reducedMotion()) {
        setDeparting(true);
        await new Promise(res => setTimeout(res, Math.max(0, DEPART_MS - (performance.now() - t0))));
        setDeparting(false);
      }
      onResult(r);
      if (ev.kind === "rejected") sfx("reject");
      else if (ev.kind === "right") { sfx("correct"); }
      else if (ev.kind === "advanced") sfx("deeper");
      else if (ev.kind === "finished" && action.type === "decide") sfx("bank");   // the landing itself sounds when the stamp lands
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
  const final = secsLeft !== null && secsLeft > 0 && secsLeft <= 3;   // the last three seconds: a double beep each second, the answer box turns red
  useEffect(() => { if (final) sfx("tick"); }, [final, secsLeft]);
  // the stamp lands: a thud and a jolt, timed to the slam
  const stopRef = useRef<HTMLElement>(null), landed = st.phase === "done";
  const nextRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => { if (landed) { toTop(); nextRef.current?.focus({ preventScroll: true }); } }, [landed]);   // the reveal opens at the top too
  // the deeper you landed, the bigger the landing: a light thud, a heavy one, or the heavy one and then gold
  const weight = weightOf(landed ? st.tier : null), descent = landed && st.tier ? DESCENT_MS[st.tier] ?? 0 : 0;
  useEffect(() => {
    if (!weight) return;
    // the plane comes down first (see the flight band); the stamp is pressed once it has landed
    const light = weight === "light" || weight === "miss", peak = descent + (light ? 230 : 350);   // the slam peaks at 55% of its run
    const ts = [setTimeout(() => { sfx(weight === "miss" ? "miss" : light ? "land" : "landBig"); shake(stopRef.current, light ? "jolt" : "jolt-big"); }, peak)];
    if (weight === "top") ts.push(setTimeout(() => { setGold(true); sfx("gold"); }, descent + GOLD_MS));
    return () => ts.forEach(clearTimeout);
  }, [weight, st.tier, descent]);
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
        <section className="stop" ref={stopRef}>
          <Frame s={s} reply={r.cityName} overlay={s.postcard ? undefined : <div className="over plate"><span className="figure flap" aria-label={r.airport}>{[...r.airport].map((ch, k) => <span key={k} aria-hidden="true" style={{ ["--k" as string]: k }}>{ch}</span>)}</span><span>{r.cityName}</span></div>}
            caption={<>{caption}.{r.credit && <> Photo: <a href={r.credit.url} target="_blank" rel="noopener">{r.credit.title}</a> by {r.credit.author} ({r.credit.license}), resized.</>}</>} />
          <div className="panel">
            <div className="result-head">
              <EntryStamp s={s} i={idx} date={day.date} motion={`slam slam--${weight}${gold ? " is-gold" : ""}`} delay={descent / 180} />
              {t.score > 0 && (weight !== "top" || gold) && <span className="gain" aria-hidden="true">+{t.score}</span>}
              <div><h1>{r.cityName}, {r.country}</h1><p className="small">{st.note}</p></div>
            </div>
            <dl className="facts">
              <dt>Region</dt><dd>{r.regionName}</dd><dt>Exact spot</dt><dd>{r.spotName}</dd><dt>Nearest airport</dt><dd>{r.airport}</dd>
              {r.leg && <><dt>Flight in</dt><dd>{r.leg.km.toLocaleString("en-GB")} km from {r.leg.from}{legFlown(st.tier) ? ", flown" : ", not flown: name the city to count it"}</dd></>}
              {r.off && <><dt>How close</dt><dd>{r.off.guess}: {r.off.capital} is {r.off.km.toLocaleString("en-GB")} km from {r.cityName}</dd></>}
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

  // the heading always says what to do now: the clue's question, then the choice, then the next thing to name
  const nextThing = st.next === "city" ? "the city" : "the exact spot";
  const question = st.phase === "decide" ? `${st.guesses.at(-1)} is right! Can you name ${nextThing}?`
    : st.step === "country" ? s.prompt : st.step === "city" ? `Now name the city in ${st.guesses[0]}.` : `${s.spotLabel}.`;
  const label = st.step === "country" ? "Country" : st.step === "city" ? "City" : "Exact spot";
  const nextScore = st.next === "city" ? TIERS.local.score : TIERS.native.score, dropScore = st.next === "city" ? TIERS.lost.score : TIERS.traveller.score;
  const secs = Math.ceil(remaining / 1000);
  return (
    <div className="play">
      <section className="stop">
        <Frame s={s} caption={caption} overlay={preview && st.endsAt !== null ? (
          <div className={`count${s.postcard ? " count--chat" : ""}`} aria-live="off"><div><div className="count-dial"><svg viewBox="0 0 120 120" aria-hidden="true"><circle className="ring-track" cx="60" cy="60" r="54" /><circle className="ring" key={countN} cx="60" cy="60" r="54" /></svg><span className="count-n" key={countN}>{countN}</span></div><span className="count-label">Typing opens in</span></div></div>) : null} />
        <div className={`panel${departing ? " is-departing" : ""}${final ? " is-final" : ""}`}>
          <div className="clockline">
            <h1 key={question} className="q-arrive">{question}</h1>
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
                <SuggestInput inputRef={inputRef} value={draft} onChange={setDraft} disabled={busy} invalid={!!msg?.warn}
                  options={st.step === "country" ? COUNTRY_NAMES : st.step === "city" ? s.cities : []} openOnFocus={st.step === "city"} />
                <button className="btn btn--primary" type="submit" disabled={busy}>Stamp it</button>
              </div>
              <p className={`help${msg?.warn ? " is-error" : ""}`} id="msg" role="status">{msg?.text}</p>
            </form>
          )}
          {st.phase === "decide" && (
            <>
              <div className="choices">
                <button className="choice choice--risk" type="button" aria-keyshortcuts="D" disabled={busy} onClick={() => send({ type: "decide", deeper: true })}>
                  <span className="c-key" aria-hidden="true">D</span><span className="c-tag">Risk it</span><span className="c-title">Name {nextThing}</span>
                  <span className="c-pts">{nextScore} <span>points</span></span><span className="c-risk">Miss and you drop to {dropScore}</span>
                </button>
                <button className="choice" type="button" aria-keyshortcuts="B" disabled={busy} onClick={() => send({ type: "decide", deeper: false })}>
                  <span className="c-key" aria-hidden="true">B</span><span className="c-tag">Play safe</span><span className="c-title">Bank it</span>
                  <span className="c-pts">{TIERS[st.banked!].score} <span>points</span></span><span className="c-risk">Keep the {TIERS[st.banked!].name} stamp</span>
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
