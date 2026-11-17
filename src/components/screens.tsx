"use client";
// The screens around play: the start (today's hand, face down), the results (the hand you played), the lifetime passport, and friend leagues.
import { useEffect, useState } from "react";
import { sfx } from "@/lib/client/fx";
import { api, type Day, type League, type Me } from "@/lib/client/api";
import { band, classFor, CLASSES, CONT, COUNTRY_MS, LADDER, legFlown, MAX_DAY_SCORE, nextClass, ROUND_MS, TIERS } from "@/lib/game/rules";
import { COUNTRIES } from "@/lib/game/match";
import { CountUp, Fan, longDate, MiniCard, ordinal } from "./bits";
import { SITE } from "@/lib/site";

const firstOpen = (day: Day) => day.stops.findIndex(s => s.state.phase !== "done");

export function Home({ day, me, leagues, onBoard, onOpenDay, onFriends }: { day: Day; me: Me | null; leagues: League[]; onBoard: () => void; onOpenDay: (d: string) => void; onFriends: () => void }) {
  const resume = day.stops.filter(s => s.state.phase === "done").length, open = firstOpen(day);
  const midStop = open >= 0 && day.stops[open].state.phase !== "ready";
  const si = me?.streak, best = me?.record.best ?? 0;
  const league = leagues[0], myRank = league ? league.members.findIndex(m => m.you) + 1 : 0;
  const shortDay = longDate(day.date).replace(/^\S+\s/, "");
  // before someone's first flight: show what a stop looks like, and keep scores, the archive and the pass out of the way
  const newcomer = !me?.days.some(d => d.score !== null || d.stopsDone);
  return (
    <div className="home" aria-label={day.isToday ? "Today's flight" : `Archive flight ${day.flight}`}>
      {!day.isToday && <p className="archive-tag">Archive flight from {longDate(day.date)}.</p>}
      <h1>Five stops. Name where you landed.</h1>
      <p className="lead">Each stop is a photo or a message from somewhere real. Name the country, then risk it for the city and a final question.</p>
      {day.isToday && si && !si.playedToday && (si.pending
        ? <p className="streak-note">Your lounge pass is covering {longDate(si.pending)}. Fly today to keep your {si.n}-day streak.</p>
        : si.n > 0 && <p className="streak-note">{si.n}-day streak. Fly today to make it {si.n + 1}.</p>)}
      {newcomer && day.example ? (
        <figure className="example">
          <div className="ex-card"><img src={day.example.img} alt={day.example.alt} width={960} height={720} /><p className="ex-q">{day.example.prompt}</p></div>
          <figcaption className="small">A stop from flight {day.example.flight}. Today’s five are new.</figcaption>
        </figure>
      ) : <Fan stops={day.stops} current={open} />}
      <div className="board-row">
        <button className="btn btn--gold btn--big" type="button" onClick={onBoard}>{midStop || resume ? `Resume at stop ${open + 1}` : `Board flight ${day.flight}`}</button>
        <span className="small">{COUNTRY_MS / 1000} seconds for the country, then {ROUND_MS / 1000} a guess</span>
        <span className="small">{newcomer ? "A new flight every day, the same for everyone. Free, no sign-up." : `Flight ${day.flight} · ${shortDay} · top score ${MAX_DAY_SCORE} · your best ${best}`}</span>
      </div>
      <details className="card howto"><summary>How to play and points</summary>
        <div className="howto-body">
          <ol className="steps">
            <li><span><strong>Name the country.</strong> Look first, then type. You get three tries, with a clue after each miss; every extra try takes 10 off.</span></li>
            <li><span><strong>Risk it or bank it.</strong> Get the country and the Backpacker stamp is yours. Drag the card right to risk it for the city, left to bank it, or use the buttons.</span></li>
            <li><span><strong>Go deeper.</strong> Name the city, then risk it again for the final question. A miss drops you a tier.</span></li>
          </ol>
          <ul className="tiers" aria-label="Stamps and their points">
            {LADDER.map(id => <li key={id} className={`t-${id}`}><b>{TIERS[id].name}</b><span>{TIERS[id].blurb}</span><em>{TIERS[id].score}</em></li>)}
          </ul>
        </div>
      </details>
      <section className="league-line">
        <p>{league && league.members.length > 1 ? `You are ${ordinal(myRank)} of ${league.members.length} in ${league.name} this week.` : "Play against friends: start a league and send them the code."}</p>
        <button className="btn btn--small" type="button" onClick={onFriends}>{league ? "See the league" : "Start a league"}</button>
      </section>
      {me && !newcomer && <Archive me={me} current={day.date} onOpenDay={onOpenDay} />}
    </div>
  );
}

function Archive({ me, current, onOpenDay }: { me: Me; current: string; onOpenDay: (d: string) => void }) {
  const [all, setAll] = useState(false), [msg, setMsg] = useState(""), SHOWN = 5;
  const left = me.unlocked ? 0 : me.vouchers.left;
  // spending is for good, so ask first; opening the flight reloads the record, which shows the voucher gone
  const spend = (date: string, flight: string) => {
    if (!confirm(`Use your boarding voucher on flight ${flight}? It stays open for good.`)) return;
    api.voucher(date).then(() => onOpenDay(date), e => setMsg(e.message));
  };
  return (
    <section className="card archive">
      <h2>Missed a flight?</h2>
      <p className="small">Play earlier days. Only today’s flight counts towards your streak and leagues.</p>
      {left > 0 && <p className="voucher-note">You have {left === 1 ? "a boarding voucher" : `${left} boarding vouchers`}. Use {left === 1 ? "it" : "one"} on any locked flight below and it stays open for good.</p>}
      <table className="table"><caption className="visually-hidden">Recent flights</caption>
        <thead><tr><th scope="col">Flight</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col" className="num"><span className="visually-hidden">Action</span></th></tr></thead>
        <tbody>{me.days.slice(0, all ? undefined : SHOWN).map(d => {
          const here = d.date === current, done = d.score !== null;
          return (
            <tr key={d.date} className={here ? "is-here" : ""}>
              <td className="flight-no">{d.flight}</td><td>{longDate(d.date)}{d.isToday ? " (today)" : ""}</td>
              <td>{done ? `Landed, ${d.score} of ${MAX_DAY_SCORE}` : d.stopsDone ? `Stop ${d.stopsDone + 1} of 5` : ""}</td>
              <td className="num">{here ? <span className="small">Open now</span>
                : d.locked ? (left > 0 ? <button className="btn btn--small" type="button" onClick={() => spend(d.date, d.flight)}>Use voucher</button> : <a className="btn btn--small" href="#archive-pass">Unlock</a>)
                : <button className="btn btn--small" type="button" onClick={() => onOpenDay(d.date)}>{done ? "See the hand" : d.stopsDone ? "Resume" : "Board"}</button>}</td>
            </tr>
          );
        })}</tbody>
      </table>
      {msg && <p className="small" role="alert">{msg}</p>}
      {!all && me.days.length > SHOWN && <button className="btn btn--small" type="button" onClick={() => setAll(true)}>Show all {me.days.length} flights</button>}
      <ArchivePass me={me} />
    </section>
  );
}

/** Today's and yesterday's flights are free; the pass opens the rest, once and for good. */
function ArchivePass({ me }: { me: Me }) {
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [email, setEmail] = useState("");
  if (me.unlocked) return <p className="small">Archive pass active. Every past flight is open.</p>;
  if (!me.days.some(d => d.locked)) return null;
  const buy = () => { setBusy(true); setMsg(""); api.checkout().then(r => location.assign(r.url), e => { setBusy(false); setMsg(e.message); }); };
  const restore = (e: React.FormEvent) => { e.preventDefault(); api.restore(email).then(() => setMsg("If that email bought a pass, a link is on its way. It works once, within 30 minutes."), err => setMsg(err.message)); };
  return (
    <div className="pass" id="archive-pass">
      <h3>Archive pass</h3>
      <p>Today’s and yesterday’s flights are free. The pass opens every earlier flight, for good: {SITE.passPrice}, paid once.</p>
      <button className="btn btn--gold" type="button" onClick={buy} disabled={busy}>{busy ? "Opening checkout…" : `Unlock the archive, ${SITE.passPrice}`}</button>
      <form className="pass-restore" onSubmit={restore}>
        <label htmlFor="restore-email">Bought it already? Enter the email you paid with and we’ll send a link to unlock this browser.</label>
        <div className="actions"><input id="restore-email" className="input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /><button className="btn btn--small" type="submit">Send link</button></div>
      </form>
      {msg && <p className="small" role="status">{msg}</p>}
    </div>
  );
}

export function Done({ day, me, onPassport, onFriends, onOpenDay }: { day: Day; me: Me | null; onPassport: () => void; onFriends: () => void; onOpenDay: (d: string) => void }) {
  const s = day.score, b = band(s), si = me?.streak;
  const [copied, setCopied] = useState("");
  // every flight ends somewhere worth knowing, whatever the score
  const places = day.stops.map(x => x.reveal ? x.reveal.cityName + ", " + x.reveal.country : "").filter(Boolean);
  const visited = places.length > 1 ? places.slice(0, -1).join("; ") + " and " + places.at(-1) : places[0] ?? "five places";
  // kilometres: every leg of the route, and the ones you flew (you fly a leg by naming the city it lands in)
  const legs = day.stops.map(x => x.reveal?.leg?.km ?? 0), km = (n: number) => n.toLocaleString("en-GB");
  const routeKm = legs.reduce((a, b) => a + b, 0), flownKm = day.stops.reduce((n, x, i) => n + (legFlown(x.state.tier) ? legs[i] : 0), 0);
  // the comparison, shortened for sharing: "Better than 76%" becomes "Top 24%"
  const rank = day.field && (day.field.better === 100 ? `Top score ${day.isToday ? "today" : "on this flight"}` : `Top ${Math.max(1, 100 - day.field.better)}% ${day.isToday ? "today" : "on this flight"}`);
  // each stop's points, not stamp names or places: nothing that spoils the day for a friend who hasn't played
  const share = [`Born There, flight ${day.flight}: ${s}/${MAX_DAY_SCORE}`, `Stops: ${day.stops.map(x => x.state.points).join(" · ")}`, flownKm ? `${km(flownKm)} km flown` : "", rank,
    day.isToday && si && si.n >= 2 ? `Streak: ${si.n} days` : "", typeof location !== "undefined" ? location.origin : ""].filter(Boolean).join("\n");
  const nC = me?.passport.countries.length ?? 0, cls = classFor(nC), nxt = nextClass(nC);
  const newC = me?.passport.countries.filter(c => c.first === day.date).length ?? 0, newCity = me?.passport.cities.filter(c => c.first === day.date).length ?? 0;
  // each card thuds as it lands in the hand, then the fanfare
  useEffect(() => {
    const ts = day.stops.map((_, i) => setTimeout(() => sfx("stamp"), i * 150 + 200 + 380));
    ts.push(setTimeout(() => { sfx("finale"); }, day.stops.length * 150 + 900));
    return () => ts.forEach(clearTimeout);
  }, [day.date]); // eslint-disable-line react-hooks/exhaustive-deps -- once per flight shown
  // the phone's own share sheet where there is one (it already lists WhatsApp, Messages and the rest), the clipboard elsewhere
  const [canShare, setCanShare] = useState(false), [phone, setPhone] = useState(false);
  useEffect(() => { setCanShare(typeof navigator.share === "function"); setPhone(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)); }, []);
  const count = (via: string) => { api.share(day.date, via).catch(() => {}); };
  const shareNow = () => canShare
    ? navigator.share({ text: share }).then(() => count("native"), () => {})   // closing the sheet isn't a share
    : navigator.clipboard.writeText(share).then(() => { setCopied("Copied to your clipboard."); count("copy"); }, () => setCopied("Select the text and copy it."));
  const text = encodeURIComponent(share), n = day.stops.length;
  return (
    <div className="done">
      <p className="done-title">{day.isToday ? "Your hand today" : `Your hand, flight ${day.flight}`}</p>
      <ol className="hand" aria-label="Your five stops">
        {day.stops.map((x, i) => {
          const off = i - (n - 1) / 2;
          return <li key={i} style={{ ["--k" as string]: i, ["--r" as string]: `${off * 7}deg`, ["--y" as string]: `${Math.abs(off) * 5}px`, ["--fx" as string]: `${-off * 60}px` }}><MiniCard s={x} i={i} /></li>;
        })}
      </ol>
      <div className="total"><span>{day.isToday ? "Today's score" : `Flight ${day.flight} score`}</span><b><CountUp to={s} ms={1400} /></b><span>of {MAX_DAY_SCORE}</span></div>
      <div className="band">
        <h1>{b.name}</h1><p>{b.verdict}</p><p className="visited">You visited {visited}.</p>
        {day.field && <p>{day.field.better === 100 ? `The best score of the ${day.field.players} players on this flight so far.` : `Better than ${day.field.better}% of the ${day.field.players} players on this flight so far.`}</p>}
      </div>
      <section className="card">
        <h2>{day.isToday ? "Share today's result" : "Share this flight"}</h2>
        <pre className="share">{share}</pre>
        <div className="actions share-to">
          <button className="btn btn--gold" type="button" onClick={shareNow}>{canShare ? "Share" : "Copy result"}</button>
          <a className="btn btn--small" href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer" onClick={() => count("whatsapp")}>WhatsApp</a>
          {phone && <a className="btn btn--small" href={`sms:?&body=${text}`} onClick={() => count("messages")}>Messages</a>}
          <a className="btn btn--small" href={`https://x.com/intent/post?text=${text}`} target="_blank" rel="noopener noreferrer" onClick={() => count("x")}>X</a>
          <span className="help" role="status">{copied}</span>
        </div>
      </section>
      {day.isToday && <Tomorrow day={day} me={me} />}
      {day.isToday && si?.milestone && (
        <section className="card milestone pop"><span className="figure">{si.milestone}</span><div><h2>{si.milestone}-day streak</h2><p>You have flown {si.milestone} days running.{si.next ? ` Next milestone: ${si.next} days.` : ""}</p></div></section>
      )}
      <section className="card">
        <h2>Your record</h2>
        {me && <dl className="stats"><div><dt>Flights</dt><dd>{me.record.flights}</dd></div><div><dt>Day streak</dt><dd>{me.streak.n}</dd></div><div><dt>Best</dt><dd>{me.record.best}</dd></div></dl>}
        <p>You flew <strong>{km(flownKm)} km</strong> of {day.isToday ? "today's" : "this flight's"} {km(routeKm)} km route.{flownKm < routeKm ? " A leg counts when you name the city it lands in." : ""}</p>
        {si && <p className="small">{si.passLeft ? "Lounge pass ready: if you miss one day this week, it keeps your streak alive." : `Lounge pass used this week, for ${longDate(si.usedThisWeek!)}. A new one arrives on Monday.`}</p>}
        {!day.isToday && <p className="small">Archive flight from {longDate(day.date)}. Only today’s flight counts towards your streak.</p>}
        <div className="actions"><button className="btn btn--small" type="button" onClick={onFriends}>Friends league</button></div>
      </section>
      <section className="card">
        <h2>Your passport grew</h2>
        <p>{newC || newCity ? `${newC ? `${newC} new ${newC === 1 ? "country" : "countries"}` : ""}${newC && newCity ? " and " : ""}${newCity ? `${newCity} new ${newCity === 1 ? "city" : "cities"}` : ""} on this flight.` : "No new places on this flight; every country here was already stamped."} You have {nC} of {COUNTRIES.length} countries.</p>
        <div className="class-track"><div className="class-row"><strong>{cls.name} class</strong><span className="small">{nxt ? `${nxt.min - nC} to ${nxt.name}` : "Top class"}</span></div>
          <span className="track" aria-hidden="true"><span className="fill" style={{ width: `${nxt ? Math.round(100 * (nC - cls.min) / (nxt.min - cls.min)) : 100}%` }} /></span>
          <button className="btn btn--small" type="button" onClick={onPassport}>Open my passport</button></div>
      </section>
      {me && <Archive me={me} current={day.date} onOpenDay={onOpenDay} />}
    </div>
  );
}

/** Reasons to come back tomorrow: what tomorrow's first stop is, and how far off the next boarding voucher is. */
function Tomorrow({ day, me }: { day: Day; me: Me | null }) {
  const t = day.tomorrow, si = me?.streak, v = me?.vouchers;
  const days = (k: number) => `${k} more ${k === 1 ? "day" : "days"} running`;
  const line = !si || !v || me.unlocked ? null
    : v.earnedToday ? `Your ${si.n}-day streak earned a boarding voucher: open any archive flight you choose, below. It stays open for good.`
    : v.next ? `${days(v.next - si.n)} to ${v.earned ? "another" : "your first"} boarding voucher: an archive flight of your choice, yours to keep.` : null;
  if (!t && !line) return null;
  return (
    <section className="card tomorrow">
      <h2>Tomorrow’s flight</h2>
      {t && <p className="lead">Flight {t.flight} boards tomorrow. Stop 1 is {t.what} in {t.continent}.</p>}
      {line && <p className={v?.earnedToday ? "tomorrow-win" : undefined}>{line}</p>}
    </section>
  );
}

export function Passport({ me, onBack }: { me: Me; onBack: () => void }) {
  const p = me.passport, nC = p.countries.length, cls = classFor(nC), nxt = nextClass(nC), si = me.streak;
  const pct = nxt ? Math.round(100 * (nC - cls.min) / (nxt.min - cls.min)) : 100;
  return (
    <div className="passport">
      <section className="card passport-head">
        <div className="count-big"><b>{nC}</b><span>of {COUNTRIES.length} countries</span></div>
        <div className="class-track"><h1>{cls.name} class</h1>
          <p>{nxt ? `${nxt.min - nC} more ${nxt.min - nC === 1 ? "country" : "countries"} to reach ${nxt.name} class.` : "The highest class there is."}</p>
          <span className="track track--lg" aria-hidden="true"><span className="fill" style={{ width: `${pct}%` }} /></span>
          <p className="small">Classes: {CLASSES.map(c => `${c.name} ${c.min}`).join(", ")} countries.</p></div>
      </section>
      <section className="card"><h2>Your streak</h2>
        <dl className="stats"><div><dt>Days running</dt><dd>{si.n}</dd></div><div><dt>Next milestone</dt><dd>{si.next ?? "Done"}</dd></div><div><dt>Lounge pass</dt><dd>{si.passLeft ? "Ready" : "Used"}</dd></div></dl>
        <p className="small">{si.pending ? `Your lounge pass is covering ${longDate(si.pending)}. Fly today to keep the streak.` : si.passLeft ? "Miss one day this week and the pass keeps your streak alive. One pass a week, renewed every Monday." : `Used for ${longDate(si.usedThisWeek!)}. A new pass arrives on Monday.`}</p>
      </section>
      <section className="card"><h2>By continent</h2>
        <div className="bars bars-wide"><ul>{Object.entries(CONT).map(([code, name]) => {
          const all = COUNTRIES.filter(c => c.cont[0] === code).length, got = p.countries.filter(c => c.cont === code).length;
          return <li key={code}><span>{name}</span><span className="track" aria-hidden="true"><span className="fill" style={{ width: `${Math.round(100 * got / all)}%` }} /></span><span>{got}/{all}</span></li>;
        })}</ul></div>
      </section>
      <section className="card"><h2>Countries stamped</h2>
        {nC ? <div className="collection">{p.countries.map(c => <div className="entry" key={c.name}><span className="e-code">{c.code}</span><span className="e-name">{c.name}</span><span className="e-meta">First stamped {longDate(c.first)}</span></div>)}</div>
            : <p className="small">No stamps yet. Name a country correctly and it lands here for good.</p>}
      </section>
      <section className="card"><h2>Born There finds</h2>
        {p.rare.length ? <div className="collection">{p.rare.map(x => <div className="entry is-rare" key={x.spot}><span className="e-code">{x.airport}</span><span className="e-name">{x.spot}</span><span className="e-meta">{x.city}, {longDate(x.first)}</span></div>)}</div>
          : <p className="small">None yet. Get the final question right on any stop to earn one; they are the rarest stamps you can collect.</p>}
      </section>
      <section className="card"><h2>Cities</h2>
        {p.cities.length ? <ul className="citylist">{p.cities.map(c => <li key={c.name}><strong>{c.airport}</strong> {c.name}</li>)}</ul> : <p className="small">Go deeper and name a city to add it here.</p>}
      </section>
      <div className="actions"><button className="btn btn--gold" type="button" onClick={onBack}>Back to the flight</button></div>
      <Forget />
    </div>
  );
}

/** Deletes everything kept about this browser's player, after a second, explicit yes. */
function Forget() {
  const [asking, setAsking] = useState(false), [msg, setMsg] = useState("");
  const forget = () => api.forget().then(() => location.assign("/"), () => setMsg("That didn't work. Try again in a moment."));
  return (
    <section className="card forget">
      <h2>Your data</h2>
      <p className="small">Your progress is tied to this browser, not an account. <a href="/privacy">What we keep, and why</a>.</p>
      {asking ? <>
        <p>This deletes your streak, passport, results and league places, and any league you started. It can&apos;t be undone.</p>
        <div className="actions"><button className="btn" type="button" onClick={forget}>Yes, delete everything</button><button className="btn btn--small" type="button" onClick={() => setAsking(false)}>Keep it</button></div>
      </> : <div className="actions"><button className="btn btn--small" type="button" onClick={() => setAsking(true)}>Delete my progress</button></div>}
      {msg && <p className="help is-error" role="status">{msg}</p>}
    </section>
  );
}

export function Friends({ me, leagues, onCreate, onJoin, onLeave, onRename, onBack, inviteCode }: {
  me: Me; leagues: League[]; inviteCode: string; onBack: () => void;
  onCreate: (name: string) => Promise<string | null>; onJoin: (code: string) => Promise<string | null>; onLeave: (id: string) => void; onRename: (name: string) => Promise<void>;
}) {
  const [code, setCode] = useState(inviteCode), [name, setName] = useState(""), [joinMsg, setJoinMsg] = useState(""), [createMsg, setCreateMsg] = useState(""), [copied, setCopied] = useState("");
  const invite = (l: League) => `${location.origin}/?join=${l.code}`;
  return (
    <div className="friends">
      <section className="home"><h1>Friends leagues</h1><p className="lead">Each league ranks this week’s daily flights, Monday to Sunday. Archive flights don’t count.</p></section>
      <form className="card field" onSubmit={async e => { e.preventDefault(); await onRename((e.currentTarget.elements.namedItem("my-name") as HTMLInputElement).value); }}>
        <label htmlFor="my-name">Your name on league boards</label>
        <div className="entry-row"><input className="input" id="my-name" name="my-name" maxLength={24} defaultValue={me.name} placeholder="A traveller" autoComplete="nickname" /><button className="btn" type="submit">Save name</button></div>
      </form>
      {leagues.map(l => (
        <section className="card" key={l.id}>
          <div className="class-row"><h2>{l.name}</h2><span className="small">Code {l.code}</span></div>
          <div className="board-wrap"><table className="table league"><caption className="visually-hidden">{l.name}, this week</caption>
            <thead><tr><th scope="col" className="rank">Rank</th><th scope="col">Traveller</th><th scope="col" className="num c-days">Days</th><th scope="col" className="num">Today</th><th scope="col" className="num c-streak">Streak</th><th scope="col" className="num">Week</th></tr></thead>
            <tbody>{l.members.map((m, k) => (
              <tr key={k} className={m.you ? "is-you" : ""}><td className="rank">{ordinal(k + 1)}</td><td className="who"><span className="name">{m.name}</span>{m.you && <> <span className="you-tag">you</span></>}</td>
                <td className="num c-days">{m.played}/7</td><td className="num">{m.todayScore ?? "Not yet"}</td><td className="num c-streak">{m.streak}</td><td className="num total">{m.total}</td></tr>
            ))}</tbody></table></div>
          <div className="actions">
            <button className="btn btn--small" type="button" onClick={() => navigator.clipboard.writeText(`Join my Born There league "${l.name}": ${invite(l)}`).then(() => setCopied(l.id), () => setCopied(""))}>{copied === l.id ? "Invite copied" : "Copy invite link"}</button>
            <button className="linkish" type="button" onClick={() => onLeave(l.id)}>Leave league</button>
          </div>
        </section>
      ))}
      {!leagues.length && <p className="small">You are not in a league yet. Start one and send friends the invite link, or join with a code a friend sent you.</p>}
      <form className="card field" noValidate onSubmit={async e => { e.preventDefault(); const err = await onJoin(code); setJoinMsg(err ?? "Joined."); if (!err) setCode(""); }}>
        <h2>Join a league</h2>
        <label htmlFor="join-code">League code</label>
        <div className="entry-row"><input className="input" id="join-code" name="join-code" value={code} onChange={e => setCode(e.target.value)} maxLength={12} autoCapitalize="characters" spellCheck={false} aria-describedby="join-msg" /><button className="btn btn--gold" type="submit">Join</button></div>
        <p className="help" id="join-msg" role="status">{joinMsg}</p>
      </form>
      <form className="card field" noValidate onSubmit={async e => { e.preventDefault(); const err = await onCreate(name); setCreateMsg(err ?? "League created. Copy the invite link and send it to friends."); if (!err) setName(""); }}>
        <h2>Start a league</h2>
        <label htmlFor="league-name">League name</label>
        <div className="entry-row"><input className="input" id="league-name" name="league-name" value={name} onChange={e => setName(e.target.value)} maxLength={24} placeholder="Friends league" aria-describedby="create-msg" /><button className="btn" type="submit">Create</button></div>
        <p className="help" id="create-msg" role="status">{createMsg}</p>
      </form>
      <div className="actions"><button className="btn" type="button" onClick={onBack}>Back to the flight</button></div>
    </div>
  );
}
