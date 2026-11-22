"use client";
// One stop as one card: drawn from the deck, the clue on its face, risk or bank by dragging it, and the place on its back.
// Every move goes to the server; the card only shows what the server says.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api, ApiError, type ActResult, type Day, type StopData } from "@/lib/client/api";
import { COUNTRIES, norm } from "@/lib/game/match";
import { legFlown, stepMs, TIERS } from "@/lib/game/rules";
import { stopPoints } from "@/lib/game/engine";
import { reducedMotion, sfx, shake, toTop } from "@/lib/client/fx";
import { CrowdBars, useReplay } from "./bits";
import { AnswerMap, GuessMap } from "./WorldMap";

// the question leaves before the next one lands; the card is drawn, then flipped; the stamp slams once the flip is done (see --t-* in globals.css)
const DEPART_MS = 650, DRAW_MS = 560, FLIP_MS = 640, SLAM_PEAK_MS = FLIP_MS - 80 + 250, GOLD_MS = 1500, DRAG_MS = 230;
type Weight = "miss" | "light" | "big" | "top";
const weightOf = (tier: string | null): Weight | null => !tier ? null : tier === "miss" ? "miss" : tier === "tourist" || tier === "lost" ? "light" : tier === "native" ? "top" : "big";
const BURST = Array.from({ length: 10 }, (_, k) => { const a = (k / 10) * Math.PI * 2; return { x: Math.round(Math.cos(a) * 90), y: Math.round(Math.sin(a) * 70) }; });

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

/** The clue itself: the photo, or the text message. */
function Clue({ s, reply, className, overlay }: { s: StopData; reply?: string; className: string; overlay?: React.ReactNode }) {
  return (
    <figure className={className} id={className === "pic" ? "clue" : undefined}>
      {s.postcard
        ? <Chat p={s.postcard} reply={reply} />
        // eslint-disable-next-line @next/next/no-img-element -- clue photos are fixed-size local files; next/image adds nothing here
        : <img src={s.img!} alt={s.alt ?? ""} width={960} height={720} />}
      {overlay}
    </figure>
  );
}

/**
 * On a phone the keyboard covers the bottom half of the screen without shrinking the page, so the box could sit under it.
 * While the box has focus, keep it and the first few suggestions in the part of the screen the keyboard leaves visible,
 * and let the suggestion list scroll within that space instead of running under the keyboard.
 */
const SUGGEST_ROOM = 3 * 44 + 8;   // three suggestions
function useAboveKeyboard(inputRef: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const vv = window.visualViewport, el = inputRef.current;
    if (!vv || !el) return;
    const room = () => { const r = el.getBoundingClientRect(); el.parentElement?.style.setProperty("--below", `${Math.max(88, vv.offsetTop + vv.height - r.bottom - 8)}px`); };
    const fit = () => {
      // the page's own height, not innerHeight: iPhone Safari shrinks innerHeight with the keyboard too, which hid the keyboard from this check
      const kb = document.documentElement.clientHeight - vv.height, typing = document.activeElement === el && kb > 120 && matchMedia("(max-width: 40rem)").matches;
      document.body.style.paddingBottom = typing ? `${kb}px` : "";   // room to scroll the box up: the keyboard doesn't make the page any longer
      if (!typing) return;
      const top = vv.offsetTop, bottom = top + vv.height, r = el.getBoundingClientRect();
      if (r.top < top + 8 || r.bottom + SUGGEST_ROOM > bottom) scrollBy({ top: r.top - Math.max(top + 8, bottom - r.height - SUGGEST_ROOM), behavior: "instant" });
      room();
    };
    vv.addEventListener("resize", fit);   // the keyboard opening or closing
    vv.addEventListener("scroll", room);
    // the game focuses the box itself, so tapping it opens the keyboard without a new focus event: check again once the keyboard is up
    const tap = () => { setTimeout(fit, 100); setTimeout(fit, 450); };
    el.addEventListener("focus", fit); el.addEventListener("blur", fit); el.addEventListener("click", tap);
    return () => { vv.removeEventListener("resize", fit); vv.removeEventListener("scroll", room); el.removeEventListener("focus", fit); el.removeEventListener("blur", fit); el.removeEventListener("click", tap); document.body.style.paddingBottom = ""; };
  }, [inputRef]);
}

/** The answer box with its own suggestion list (a combobox): the browser's <datalist> shows nothing on many phones and in-app browsers. */
function SuggestInput({ inputRef, value, onChange, options, openOnFocus, disabled, invalid }: {
  inputRef: React.RefObject<HTMLInputElement | null>; value: string; onChange: (v: string) => void; options: string[]; openOnFocus: boolean; disabled: boolean; invalid: boolean;
}) {
  const [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  useAboveKeyboard(inputRef);
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
        onChange={e => { onChange(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onBlur={() => setOpen(false)}
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

const clockText = (secs: number) => Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");

/** After a wrong country: how far off each try was and which way to head, then the continent, and a map to work it out on. */
function Clues({ c, secs }: { c: NonNullable<StopData["state"]["clues"]>; secs: number }) {
  return (
    <div className="clues" role="status" aria-live="polite">
      <ol>
        {c.tries.map(t => (
          <li key={t.name}>
            <span className="c-name">{t.name}</span>
            {t.km !== null && t.arrow
              ? <span className="c-dir"><b aria-hidden="true">{t.arrow}</b> {t.km.toLocaleString("en-GB")} km {t.dir}{t.capital ? <span className="from"> from {t.capital}</span> : null}</span>
              : <span className="c-dir">Not it</span>}
          </li>
        ))}
      </ol>
      <p className="c-left">{c.continent ? <>Hint: it’s in <strong>{c.continent}</strong>. </> : null}{c.triesLeft} {c.triesLeft === 1 ? "try" : "tries"} left.</p>
      <GuessMap tries={c.tries} secs={secs} />
    </div>
  );
}

function Ladder({ s }: { s: StopData }) {
  const order = ["country", "city", "spot"] as const, at = order.indexOf(s.state.phase === "decide" ? s.state.next! : s.state.step);
  const pts = (tier: "backpacker" | "local" | "native") => stopPoints({ tier, misses: s.state.misses });   // each extra try at the country takes a little off
  const steps: [string, number][] = [["Country", pts("backpacker")], ["City", pts("local")], [s.spotWord ?? "Final question", pts("native")]];   // what it asks stays hidden until the country is right
  return (
    <ol className="ladder" aria-label="How deep you are">
      {steps.map(([label, p], k) => {
        const state = k < at ? "is-done" : k === at && s.state.phase === "input" ? "is-live" : "";
        const just = s.state.phase === "decide" && k === at - 1;
        return <li key={label} className={`${state}${just ? " is-just" : ""}`} data-gain={just ? `+${p}` : undefined} aria-current={state === "is-live" ? "step" : undefined}><span>{label}</span><b>{p}</b></li>;
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
  const [departing, setDeparting] = useState(false), [gold, setGold] = useState(false);
  const sentTimeout = useRef(false), deciding = useRef(false);
  const rowRef = useReplay<HTMLDivElement>("shake", shakeKey);
  const inputRef = useRef<HTMLInputElement>(null), stageRef = useRef<HTMLDivElement>(null), dragRef = useRef<HTMLDivElement>(null), nextRef = useRef<HTMLButtonElement>(null);

  // the draw: a stop that hasn't been played slides up off the deck face down, then turns face up; a played one opens on its back
  const landed = st.phase === "done";
  const [fresh] = useState(() => !landed && !reducedMotion());
  const [opened] = useState(landed);
  const [faceUp, setFaceUp] = useState(!fresh);
  useEffect(() => { if (!fresh) return; const t = setTimeout(() => setFaceUp(true), DRAW_MS * 0.55); return () => clearTimeout(t); }, [fresh]);
  const down = landed || !faceUp;

  const send = useCallback(async (action: Parameters<typeof api.play>[2]) => {
    if (busy) return;
    setBusy(true);
    const t0 = performance.now();
    if (action.type === "guess") sfx("submit");
    try {
      const r = await api.play(day.date, idx, action);
      const ev = r.event;
      // a guess that moves the stop on: the question leaves first, then the next one arrives; a bounced guess stays put
      if ((ev.kind === "right" || ev.kind === "finished" || ev.kind === "advanced") && action.type !== "decide" && !reducedMotion()) {
        setDeparting(true);
        await new Promise(res => setTimeout(res, Math.max(0, DEPART_MS - (performance.now() - t0))));
        setDeparting(false);
      }
      onResult(r);
      if (ev.kind === "rejected") sfx("reject");
      else if (ev.kind === "right") sfx("correct");
      else if (ev.kind === "wrong") { sfx("reject"); setShakeKey(k => (k ?? 0) + 1); shake(dragRef.current, "jolt"); }   // the clue list says how far off and which way
      else if (ev.kind === "advanced") sfx("deeper");
      else if (ev.kind === "finished" && action.type === "decide") sfx("bank");   // the landing itself sounds when the stamp lands
      if (ev.kind === "correction") { setDraft(ev.suggestion); setMsg({ text: `Did you mean ${ev.suggestion}? Press Enter to confirm.`, warn: false }); }
      else if (ev.kind === "rejected") { setMsg({ text: ev.message, warn: true }); setShakeKey(k => (k ?? 0) + 1); }
      else { setMsg(null); setDraft(""); }
    } catch (e) { onError(e instanceof ApiError ? e.message : "Something went wrong."); }
    finally { setBusy(false); deciding.current = false; }
  }, [busy, day.date, idx, onResult, onError]);

  // the clock: server deadline, shown in local time via the measured offset
  useEffect(() => { if (st.phase !== "input") return; const t = setInterval(() => setNow(Date.now() + offset), 100); return () => clearInterval(t); }, [st.phase, offset]);
  useEffect(() => { sentTimeout.current = false; }, [st.step, st.phase, idx]);
  const STEP_MS = stepMs(st.step);
  const preview = st.phase === "input" && st.step === "country" && st.endsAt !== null && now < st.endsAt - STEP_MS;
  const remaining = st.endsAt === null ? STEP_MS : Math.max(0, Math.min(STEP_MS, st.endsAt - now));
  useEffect(() => {
    if (st.phase === "input" && st.endsAt !== null && now >= st.endsAt && !sentTimeout.current) { sentTimeout.current = true; void send({ type: "timeout", text: draft.trim() || undefined }); }
  }, [now, st.phase, st.endsAt, draft, send]);
  useEffect(() => { if (st.phase === "input" && !preview && faceUp) inputRef.current?.focus({ preventScroll: true }); }, [st.phase, st.step, preview, faceUp]);   // focusing must not drag the page away from the clue
  const countN = preview && st.endsAt !== null ? Math.max(1, Math.ceil((st.endsAt - STEP_MS - now) / 1000)) : 0;
  const secsLeft = st.phase === "input" && !preview ? Math.ceil(remaining / 1000) : null;
  const wasPreview = useRef(preview);
  useEffect(() => { if (countN) sfx("count"); }, [countN]);
  useEffect(() => { if (wasPreview.current && !preview && st.phase === "input") sfx("go"); wasPreview.current = preview; }, [preview, st.phase]);
  const final = secsLeft !== null && secsLeft > 0 && secsLeft <= 3;   // the last three seconds: a double beep each second, the answer box turns red
  useEffect(() => { if (final) sfx("tick"); }, [final, secsLeft]);

  // the landing: the card turns over, then the stamp slams; the deeper you landed, the harder it lands, and Born There turns gold
  useLayoutEffect(() => { if (landed && !opened) { toTop(); nextRef.current?.focus({ preventScroll: true }); } }, [landed, opened]);   // the reveal opens at the top
  const weight = weightOf(landed ? st.tier : null);
  useEffect(() => {
    if (!weight) return;
    if (opened) { if (weight === "top") setGold(true); return; }   // a stop played earlier: no fanfare again
    const light = weight === "light" || weight === "miss";
    const ts = [setTimeout(() => {
      sfx(weight === "miss" ? "miss" : light ? "land" : "landBig");
      if (weight === "miss") shake(dragRef.current, "shake"); else shake(stageRef.current, light ? "jolt" : "jolt-big");
    }, reducedMotion() ? 0 : SLAM_PEAK_MS)];
    if (weight === "top") ts.push(setTimeout(() => { setGold(true); sfx("gold"); }, reducedMotion() ? 0 : GOLD_MS));
    return () => ts.forEach(clearTimeout);
  }, [weight, opened]);

  // risk or bank: drag the card right to risk it, left to bank it; the buttons and D / B do the same
  const setDrag = (dx: number) => {
    const d = dragRef.current, sg = stageRef.current; if (!d || !sg) return;
    d.style.transform = dx ? `translateX(${dx}px) rotate(${dx * 0.05}deg)` : "";
    const k = Math.min(1, Math.abs(dx) / 110);
    sg.style.setProperty("--risk", String(dx > 0 ? k : 0)); sg.style.setProperty("--bank", String(dx < 0 ? k : 0));
  };
  const decide = useCallback((deeper: boolean) => {
    if (busy || deciding.current || st.phase !== "decide") return;
    deciding.current = true;
    dragRef.current?.classList.remove("dragging", "hint");
    if (reducedMotion()) { void send({ type: "decide", deeper }); return; }
    setDrag(deeper ? 150 : -150);
    setTimeout(() => { setDrag(0); void send({ type: "decide", deeper }); }, DRAG_MS);
  }, [busy, st.phase, send]);
  const pd = useRef<{ x: number; dx: number } | null>(null);
  const endDrag = () => {
    const p = pd.current, d = dragRef.current; if (!p || !d) return;
    pd.current = null; d.classList.remove("dragging");
    const th = Math.min(110, d.offsetWidth * 0.28);
    if (p.dx > th) decide(true); else if (p.dx < -th) decide(false); else setDrag(0);
  };
  // the first time the choice comes up, the card wiggles both ways to show it can be dragged
  useEffect(() => { if (st.phase === "decide" && !reducedMotion()) shake(dragRef.current, "hint"); }, [st.phase, st.next]);
  useEffect(() => {
    if (st.phase !== "decide") return;
    const onKey = (e: KeyboardEvent) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toLowerCase(); if (k === "d") decide(true); if (k === "b") decide(false); };
    addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey);
  }, [st.phase, decide]);

  const last = idx === day.stops.length - 1;
  const nextThing = st.next === "city" ? "the city" : `the ${s.spotWord?.toLowerCase()}`;
  // the heading always says what to do now: the clue's question, then the choice, then the next thing to name
  const question = st.phase === "decide" ? `${st.guesses.at(-1)} is right! Can you name ${nextThing}?`
    : landed ? s.prompt : st.step === "country" ? s.prompt : st.step === "city" ? `Now name the city in ${st.guesses[st.misses ?? 0]}.` : s.spotLabel;
  const label = st.step === "country" ? "Country" : st.step === "city" ? "City" : s.spotWord;
  const p = (tier: Parameters<typeof stopPoints>[0]["tier"]) => stopPoints({ tier, misses: st.misses });   // the points on offer, after any extra tries
  const nextScore = p(st.next === "city" ? "local" : "native"), dropScore = p(st.next === "city" ? "lost" : "traveller");
  const secs = Math.ceil(remaining / 1000);
  const ticking = st.phase === "input" && !preview;
  const front = `face front${ticking && remaining < 8000 ? " is-low" : ""}${st.phase === "decide" ? " is-stopped" : ""}${departing ? " is-departing" : ""}${final ? " is-final" : ""}`;

  const r = s.reveal, tier = st.tier;
  // a miss is common: say so, with the crowd figure, when most players missed it too
  const company = r && (tier === "miss" || tier === "tourist") && r.crowd.values[0] <= 50
    ? (r.crowd.source === "live" ? "Only " : "Usually only ") + Math.max(1, Math.round(r.crowd.values[0] / 10)) + " in 10 players " + (r.crowd.source === "live" ? "named " : "name ") + r.country + ". Now you’re one who knows it." : null;

  return (
    <div className="play">
      <div className={`stage${st.phase === "decide" ? " deciding" : ""}`} ref={stageRef}>
        <span className="tab tab-bank" aria-hidden="true">Stay {st.banked ? p(st.banked) : ""}</span>
        <span className="tab tab-risk" aria-hidden="true">Risk {nextScore} · drop to {dropScore}</span>
        <div ref={dragRef} className={`drag${st.phase === "decide" ? " can-drag" : ""}`}
          onPointerDown={e => { if (st.phase !== "decide" || busy || e.button > 0) return; pd.current = { x: e.clientX, dx: 0 }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* not capturable */ } e.currentTarget.classList.remove("hint"); e.currentTarget.classList.add("dragging"); }}
          onPointerMove={e => { if (!pd.current) return; pd.current.dx = e.clientX - pd.current.x; setDrag(pd.current.dx); }}
          onPointerUp={endDrag} onPointerCancel={endDrag}>
          <div className={`slide${fresh ? " drawing" : ""}`}>
            <div className={`flip${down ? " down" : ""}${opened ? " instant" : ""}`}>
              <section className={front} aria-hidden={down || undefined} inert={down}>
                <div className="fuse" aria-hidden="true"><i style={{ transform: `scaleX(${ticking ? remaining / STEP_MS : st.phase === "decide" ? 1 : 1})` }} /></div>
                <div className="corner">
                  <span className="idx"><b>{idx + 1}</b><span>{s.type}</span></span>
                  {!landed && (
                    <span className="clock" role="timer" aria-label={st.phase === "decide" ? "Clock stopped while you decide" : "Time left"}>
                      <span>{st.phase === "decide" ? "Stopped" : "Time left"}</span><b>{clockText(ticking ? secs : STEP_MS / 1000)}</b>
                    </span>
                  )}
                </div>
                <Clue s={s} className="pic" overlay={preview && st.endsAt !== null ? (
                  <div className={`count${s.postcard ? " count--chat" : ""}`} aria-live="off"><b key={countN}>{countN}</b><span>Typing opens in</span></div>) : null} />
                <h1 key={question} className="q q-arrive">{question}</h1>
                <Ladder s={s} />
                {preview && <p className="lead-help">Look first. Typing opens when the clock starts. You get three tries at the country.</p>}
                {st.clues && <Clues c={st.clues} secs={secs} />}
                {st.phase === "input" && !preview && (
                  <form className="field" autoComplete="off" noValidate onSubmit={e => { e.preventDefault(); if (draft.trim()) void send({ type: "guess", text: draft }); }}>
                    <label htmlFor="guess">{label}</label>
                    <div className="entry-row" ref={rowRef}>
                      <SuggestInput inputRef={inputRef} value={draft} onChange={setDraft} disabled={busy} invalid={!!msg?.warn}
                        options={st.step === "country" ? COUNTRY_NAMES : st.step === "city" ? s.cities : []} openOnFocus={st.step === "city"} />
                      <button className="btn btn--gold" type="submit" disabled={busy}>Stamp it</button>
                    </div>
                    <p className={`help${msg?.warn ? " is-error" : ""}`} id="msg" role="status">{msg?.text}</p>
                  </form>
                )}
              </section>

              {landed && r && tier ? (
                <section className={`face back place is-${weight}`} aria-hidden={!down || undefined} inert={!down}>
                  <div className="p-pic">
                    <Clue s={s} reply={r.cityName} className="p-clue" />
                    <span className="p-code" aria-label={`Nearest airport ${r.airport}`}>{r.airport}</span>
                    <div className={`stamp${gold ? " is-gold" : ""}`} role="img" aria-label={`${TIERS[tier].name} stamp, ${st.points} points`}>
                      <span className="s-top" aria-hidden="true">Stop {idx + 1} · {r.airport}</span><b aria-hidden="true">{TIERS[tier].name}</b><span className="s-pts" aria-hidden="true">{st.points} points</span>
                    </div>
                    {gold && !opened && <span className="burst" aria-hidden="true">{BURST.map((b, k) => <i key={k} style={{ ["--x" as string]: `${b.x}px`, ["--y" as string]: `${b.y}px` }} />)}</span>}
                  </div>
                  <div className="p-head"><h1>{r.cityName}, {r.country}</h1>{st.points > 0 && (weight !== "top" || gold) && <span className="gain" aria-hidden="true">+{st.points}</span>}</div>
                  <p className="p-note">{st.note}</p>
                  <div className="actions"><button className="btn btn--gold" type="button" onClick={onNext} ref={nextRef}>{last ? "See your route" : `Board stop ${idx + 2}`}</button></div>
                  {r.tells && <div className="tells"><h2>What gave it away</h2><p>{r.tells}</p></div>}
                  <p className="fact-lead">{r.fact}</p>
                  {company && <p className="company">{company}</p>}
                  <dl className="facts">
                    <dt>Region</dt><dd>{r.regionName}</dd><dt>{s.spotWord}</dt><dd>{r.spotName}</dd><dt>Nearest airport</dt><dd>{r.airport}</dd>
                    {r.leg && <><dt>Flight in</dt><dd>{r.leg.km.toLocaleString("en-GB")} km from {r.leg.from}{legFlown(tier) ? ", flown" : ", not flown: name the city to count it"}</dd></>}
                    {r.off && <><dt>How close</dt><dd>{r.off.guess}: {r.off.capital} is {r.off.km.toLocaleString("en-GB")} km from {r.cityName}</dd></>}
                    {st.guesses.length > 0 && <><dt>Your route</dt><dd>{st.guesses.join(", then ")}</dd></>}
                  </dl>
                  {r.at && <AnswerMap country={r.country} city={r.cityName} lat={r.at.lat} lng={r.at.lng} guesses={st.guesses.slice(0, (st.misses ?? 0) + 1)} />}
                  <CrowdBars crowd={r.crowd} spot={s.spotWord!} />
                  {r.credit && <p className="credit">Photo: <a href={r.credit.url} target="_blank" rel="noopener">{r.credit.title}</a> by {r.credit.author} ({r.credit.license}), resized.</p>}
                </section>
              ) : (
                <div className="face back pattern" aria-hidden="true"><span className="emblem"><small>Stop</small>{idx + 1}</span></div>
              )}
            </div>
          </div>
        </div>

        {st.phase === "decide" && (
          <div className="choices">
            <p className="stopped">Clock stopped while you decide. Drag the card right to risk it, left to stay.</p>
            <div className="pick">
              <button className="choice choice--bank" type="button" aria-keyshortcuts="B" disabled={busy} onClick={() => decide(false)}>
                <span className="c-key" aria-hidden="true">B</span><span className="c-tag">Play safe</span><span className="c-title">Stay here</span>
                <span className="c-pts">{p(st.banked)} <span>points</span></span><span className="c-risk">Keep the {TIERS[st.banked!].name} stamp</span>
              </button>
              <button className="choice choice--risk" type="button" aria-keyshortcuts="D" disabled={busy} onClick={() => decide(true)}>
                <span className="c-key" aria-hidden="true">D</span><span className="c-tag">Risk it</span><span className="c-title">Name {nextThing}</span>
                <span className="c-pts">{nextScore} <span>points</span></span><span className="c-risk">Miss and you drop to {dropScore}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
