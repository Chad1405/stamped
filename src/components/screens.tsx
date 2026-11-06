"use client";
// The screens around play: start, the day's passport, the lifetime passport, and friend leagues.
import { useEffect, useState } from "react";
import { sfx } from "@/lib/client/fx";
import type { Day, League, Me } from "@/lib/client/api";
import { band, classFor, CLASSES, CONT, LADDER, legFlown, MAX_DAY_SCORE, nextClass, TIERS } from "@/lib/game/rules";
import { COUNTRIES } from "@/lib/game/match";
import { CountUp, EntryStamp, longDate, ordinal, Strip } from "./bits";

const firstOpen = (day: Day) => day.stops.findIndex(s => s.state.phase !== "done");

export function Home({ day, me, leagues, onBoard, onOpenDay, onFriends }: { day: Day; me: Me | null; leagues: League[]; onBoard: () => void; onOpenDay: (d: string) => void; onFriends: () => void }) {
  const resume = day.stops.filter(s => s.state.phase === "done").length, open = firstOpen(day);
  const midStop = open >= 0 && day.stops[open].state.phase !== "ready";
  const si = me?.streak, best = me?.record.best ?? 0;
  const league = leagues[0], myRank = league ? league.members.findIndex(m => m.you) + 1 : 0;
  const shortDay = longDate(day.date).replace(/^\S+\s/, "");
  return (
    <div className="panel" style={{ gap: "var(--space-xl)" }}>
      <section className="ticket" aria-label={day.isToday ? "Today's flight" : `Archive flight ${day.flight}`}>
        <div className="ticket-main">
          {!day.isToday && <p className="archive-tag">Archive flight from {longDate(day.date)}.</p>}
          <h1>Five stops. Name where you landed.</h1>
          <p className="lead">Name the country, then risk it for the city and the exact spot.</p>
          {day.isToday && si && !si.playedToday && (si.pending
            ? <p className="streak-note">Your lounge pass is covering {longDate(si.pending)}. Fly today to keep your {si.n}-day streak.</p>
            : si.n > 0 && <p className="streak-note">{si.n}-day streak. Fly today to make it {si.n + 1}.</p>)}
          <Strip stops={day.stops} current={open} />
          <div className="actions">
            <button className="btn btn--primary btn--big" type="button" onClick={onBoard}>{midStop || resume ? `Resume at stop ${open + 1}` : `Board flight ${day.flight}`}</button>
            <span className="small">30 seconds a guess</span>
          </div>
        </div>
        <div className="ticket-stub">
          <div><span className="small" style={{ color: "inherit" }}>Flight</span><div className="flightno">{day.flight}</div></div>
          <dl><div><dt>Date</dt><dd>{shortDay}</dd></div><div><dt>Stops</dt><dd>{day.stops.length}</dd></div><div><dt>Top score</dt><dd>{MAX_DAY_SCORE}</dd></div><div><dt>Your best</dt><dd>{best}</dd></div></dl>
        </div>
      </section>
      <details className="howto"><summary>How to play and points</summary>
        <section className="points">
          <div className="start-head"><h2>Points by how close you land</h2><p>You get three tries at the country, with a clue after each miss; every extra try takes 10 off. Get it and the Backpacker stamp is yours. Go deeper for more; a miss drops you a tier.</p></div>
          <table className="table"><caption className="visually-hidden">Stamps and their points</caption>
            <thead><tr><th scope="col">Stamp</th><th scope="col" className="num">Points</th></tr></thead>
            <tbody>{LADDER.map(id => <tr key={id}><td><span className="tier">{TIERS[id].name}</span><span className="note">{TIERS[id].blurb}</span></td><td className="num">{TIERS[id].score}</td></tr>)}</tbody>
          </table>
        </section>
      </details>
      <section className="league-line">
        <p>{league && league.members.length > 1 ? `You are ${ordinal(myRank)} of ${league.members.length} in ${league.name} this week.` : "Play against friends: start a league and send them the code."}</p>
        <button className="btn btn--small" type="button" onClick={onFriends}>{league ? "See the league" : "Start a league"}</button>
      </section>
      {me && <Archive me={me} current={day.date} onOpenDay={onOpenDay} />}
    </div>
  );
}

function Archive({ me, current, onOpenDay }: { me: Me; current: string; onOpenDay: (d: string) => void }) {
  return (
    <section className="points archive">
      <div className="start-head"><h2>Missed a flight?</h2><p>Play earlier days. Only today’s flight counts towards your streak and leagues.</p></div>
      <table className="table"><caption className="visually-hidden">Recent flights</caption>
        <thead><tr><th scope="col">Flight</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col" className="num"><span className="visually-hidden">Action</span></th></tr></thead>
        <tbody>{me.days.map(d => {
          const here = d.date === current, done = d.score !== null;
          return (
            <tr key={d.date} className={here ? "is-here" : ""}>
              <td className="flight-no">{d.flight}</td><td>{longDate(d.date)}{d.isToday ? " (today)" : ""}</td>
              <td>{done ? `Landed, ${d.score} of ${MAX_DAY_SCORE}` : d.stopsDone ? `Stop ${d.stopsDone + 1} of 5` : "Not flown"}</td>
              <td className="num">{here ? <span className="small">Open now</span> : <button className="btn btn--small" type="button" onClick={() => onOpenDay(d.date)}>{done ? "See passport" : d.stopsDone ? "Resume" : "Board"}</button>}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </section>
  );
}

export function Done({ day, me, onPassport, onFriends, onOpenDay }: { day: Day; me: Me | null; onPassport: () => void; onFriends: () => void; onOpenDay: (d: string) => void }) {
  const s = day.score, b = band(s), si = me?.streak;
  const [copied, setCopied] = useState("");
  const tiers = day.stops.map(x => x.state.tier!);
  // every flight ends somewhere worth knowing, whatever the score
  const places = day.stops.map(x => x.reveal ? x.reveal.cityName + ", " + x.reveal.country : "").filter(Boolean);
  const visited = places.length > 1 ? places.slice(0, -1).join("; ") + " and " + places.at(-1) : places[0] ?? "five places";
  // kilometres: every leg of the route, and the ones you flew (you fly a leg by naming the city it lands in)
  const legs = day.stops.map(x => x.reveal?.leg?.km ?? 0), km = (n: number) => n.toLocaleString("en-GB");
  const routeKm = legs.reduce((a, b) => a + b, 0), flownKm = day.stops.reduce((n, x, i) => n + (legFlown(x.state.tier) ? legs[i] : 0), 0);
  const share = `Stamped, flight ${day.flight}: ${s}/${MAX_DAY_SCORE}\n${tiers.map(t => TIERS[t].emoji).join("")}${flownKm ? `\n✈️ ${km(flownKm)} km flown` : ""}${day.isToday && si && si.n >= 2 ? `\nStreak: ${si.n} days` : ""}\n${typeof location !== "undefined" ? location.origin : ""}`;
  const nC = me?.passport.countries.length ?? 0, cls = classFor(nC), nxt = nextClass(nC);
  const newC = me?.passport.countries.filter(c => c.first === day.date).length ?? 0, newCity = me?.passport.cities.filter(c => c.first === day.date).length ?? 0;
  // each stamp thuds as it slams into the passport, then the fanfare
  useEffect(() => {
    const ts = day.stops.map((_, i) => setTimeout(() => sfx("stamp"), (i + 1) * 180 + 280));
    ts.push(setTimeout(() => { sfx("finale"); }, (day.stops.length + 1) * 180 + 500));
    return () => ts.forEach(clearTimeout);
  }, [day.date]); // eslint-disable-line react-hooks/exhaustive-deps -- once per flight shown
  const copy = () => navigator.clipboard.writeText(share).then(() => setCopied("Copied to your clipboard."), () => setCopied("Select the text and copy it."));
  return (
    <div className="panel" style={{ gap: "var(--space-2xl)" }}>
      <section className="arrive">
        <div className="score plate"><span>{day.isToday ? "Today's score" : `Flight ${day.flight} score`}</span><span className="figure"><CountUp to={s} ms={1400} /></span><span>of {MAX_DAY_SCORE}</span></div>
        <div><h1>{b.name}</h1><p className="lead">{b.verdict}</p><p className="visited">You visited {visited}.</p></div>
      </section>
      <section className="flightlog">
        <div className="start-head"><h2>Flight log</h2><p>You flew <strong>{km(flownKm)} km</strong> of {day.isToday ? "today's" : "this flight's"} {km(routeKm)} km route.{flownKm < routeKm ? " A leg counts when you name the city it lands in." : ""}</p></div>
        <ol className="fl-chart" aria-label="Points at each stop">
          {day.stops.map((x, i) => {
            const t = x.state.tier ? TIERS[x.state.tier] : null;
            return (
              <li key={i} style={{ ["--i" as string]: i, ["--h" as string]: `${x.state.points}%` }} className={x.state.tier === "native" ? "is-top" : t && t.score >= 60 ? "is-deep" : ""}>
                <span className="fl-track" aria-hidden="true"><span className="fl-bar" /></span>
                <span className="fl-pts">{x.state.points}</span>
                <span className="fl-code">{x.reveal?.code ?? "???"}</span>
                <span className="fl-meta">{i + 1} {x.type.toLowerCase()}{legs[i] ? `, ${km(legs[i])} km` : ""}</span>
              </li>
            );
          })}
        </ol>
      </section>
      {day.isToday && si?.milestone && (
        <section className="milestone plate pop"><span className="figure">{si.milestone}</span><div><h2>{si.milestone}-day streak</h2><p>You have flown {si.milestone} days running.{si.next ? ` Next milestone: ${si.next} days.` : ""}</p></div></section>
      )}
      <section className="growth">
        <div><h2>Your passport grew</h2><p>{newC || newCity ? `${newC ? `${newC} new ${newC === 1 ? "country" : "countries"}` : ""}${newC && newCity ? " and " : ""}${newCity ? `${newCity} new ${newCity === 1 ? "city" : "cities"}` : ""} on this flight.` : "No new places on this flight; every country here was already stamped."} You have {nC} of {COUNTRIES.length} countries.</p></div>
        <div className="class-track"><div className="class-row"><strong>{cls.name} class</strong><span className="small">{nxt ? `${nxt.min - nC} to ${nxt.name}` : "Top class"}</span></div>
          <span className="track" aria-hidden="true"><span className="fill" style={{ width: `${nxt ? Math.round(100 * (nC - cls.min) / (nxt.min - cls.min)) : 100}%` }} /></span>
          <button className="btn btn--small" type="button" onClick={onPassport}>Open my passport</button></div>
      </section>
      <section className="panel"><h2>Your stamps</h2><div className="stamps">{day.stops.map((x, i) => <EntryStamp key={i} s={x} i={i} date={day.date} motion="slam" delay={i + 1} />)}</div></section>
      <section className="ledger">
        <div><h2>{day.isToday ? "Share today's result" : "Share this flight"}</h2><pre className="share">{share}</pre>
          <div className="actions"><button className="btn btn--primary" type="button" onClick={copy}>Copy result</button><button className="btn" type="button" onClick={onFriends}>Friends league</button><span className="help" role="status">{copied}</span></div></div>
        <div><h2>Your record</h2>
          {me && <dl className="stats"><div><dt>Flights</dt><dd>{me.record.flights}</dd></div><div><dt>Day streak</dt><dd>{me.streak.n}</dd></div><div><dt>Best</dt><dd>{me.record.best}</dd></div></dl>}
          {si && <p className="small">{si.passLeft ? "Lounge pass ready: if you miss one day this week, it keeps your streak alive." : `Lounge pass used this week, for ${longDate(si.usedThisWeek!)}. A new one arrives on Monday.`}</p>}
          {!day.isToday && <p className="small">Archive flight from {longDate(day.date)}. Only today’s flight counts towards your streak.</p>}
        </div>
      </section>
      {me && <Archive me={me} current={day.date} onOpenDay={onOpenDay} />}
    </div>
  );
}

export function Passport({ me, onBack }: { me: Me; onBack: () => void }) {
  const p = me.passport, nC = p.countries.length, cls = classFor(nC), nxt = nextClass(nC), si = me.streak;
  const pct = nxt ? Math.round(100 * (nC - cls.min) / (nxt.min - cls.min)) : 100;
  return (
    <div className="panel" style={{ gap: "var(--space-2xl)" }}>
      <section className="arrive">
        <div className="score plate"><span>Countries</span><span className="figure">{nC}</span><span>of {COUNTRIES.length}</span></div>
        <div className="class-track"><h1>{cls.name} class</h1>
          <p className="lead">{nxt ? `${nxt.min - nC} more ${nxt.min - nC === 1 ? "country" : "countries"} to reach ${nxt.name} class.` : "The highest class there is."}</p>
          <span className="track track--lg" aria-hidden="true"><span className="fill" style={{ width: `${pct}%` }} /></span>
          <p className="small">Classes: {CLASSES.map(c => `${c.name} ${c.min}`).join(", ")} countries.</p></div>
      </section>
      <section className="ledger">
        <div><h2>Your streak</h2>
          <dl className="stats"><div><dt>Days running</dt><dd>{si.n}</dd></div><div><dt>Next milestone</dt><dd>{si.next ?? "Done"}</dd></div><div><dt>Lounge pass</dt><dd>{si.passLeft ? "Ready" : "Used"}</dd></div></dl>
          <p className="small">{si.pending ? `Your lounge pass is covering ${longDate(si.pending)}. Fly today to keep the streak.` : si.passLeft ? "Miss one day this week and the pass keeps your streak alive. One pass a week, renewed every Monday." : `Used for ${longDate(si.usedThisWeek!)}. A new pass arrives on Monday.`}</p></div>
        <div className="bars"><h2>By continent</h2><ul>{Object.entries(CONT).map(([code, name]) => {
          const all = COUNTRIES.filter(c => c.cont[0] === code).length, got = p.countries.filter(c => c.cont === code).length;
          return <li key={code}><span>{name}</span><span className="track" aria-hidden="true"><span className="fill" style={{ width: `${Math.round(100 * got / all)}%` }} /></span><span>{got}/{all}</span></li>;
        })}</ul></div>
      </section>
      <section className="panel"><h2>Countries stamped</h2>
        {nC ? <div className="collection">{p.countries.map(c => <div className="entry is-deep" key={c.name}><span className="e-code">{c.code}</span><span className="e-name">{c.name}</span><span className="e-meta">First stamped {longDate(c.first)}</span></div>)}</div>
            : <p className="small">No stamps yet. Name a country correctly and it lands here for good.</p>}
      </section>
      <section className="ledger">
        <div><h2>Born There finds</h2>{p.rare.length ? <div className="collection">{p.rare.map(x => <div className="entry is-rare" key={x.spot}><span className="e-code">{x.airport}</span><span className="e-name">{x.spot}</span><span className="e-meta">{x.city}, {longDate(x.first)}</span></div>)}</div>
          : <p className="small">None yet. Name the exact spot on any stop to earn one; they are the rarest stamps you can collect.</p>}</div>
        <div><h2>Cities</h2>{p.cities.length ? <ul className="citylist">{p.cities.map(c => <li key={c.name}><strong>{c.airport}</strong> {c.name}</li>)}</ul> : <p className="small">Go deeper and name a city to add it here.</p>}</div>
      </section>
      <div className="actions"><button className="btn btn--primary" type="button" onClick={onBack}>Back to the flight</button></div>
    </div>
  );
}

export function Friends({ me, leagues, onCreate, onJoin, onLeave, onRename, onBack, inviteCode }: {
  me: Me; leagues: League[]; inviteCode: string; onBack: () => void;
  onCreate: (name: string) => Promise<string | null>; onJoin: (code: string) => Promise<string | null>; onLeave: (id: string) => void; onRename: (name: string) => Promise<void>;
}) {
  const [code, setCode] = useState(inviteCode), [name, setName] = useState(""), [joinMsg, setJoinMsg] = useState(""), [createMsg, setCreateMsg] = useState(""), [copied, setCopied] = useState("");
  const invite = (l: League) => `${location.origin}/?join=${l.code}`;
  return (
    <div className="panel" style={{ gap: "var(--space-2xl)" }}>
      <section className="start-head"><h1>Friends leagues</h1><p className="lead">Each league ranks this week’s daily flights, Monday to Sunday. Archive flights don’t count.</p></section>
      <form className="field" style={{ maxWidth: "28rem" }} onSubmit={async e => { e.preventDefault(); await onRename((e.currentTarget.elements.namedItem("my-name") as HTMLInputElement).value); }}>
        <label htmlFor="my-name">Your name on league boards</label>
        <div className="entry-row"><input className="input" id="my-name" name="my-name" maxLength={24} defaultValue={me.name} placeholder="A traveller" autoComplete="nickname" /><button className="btn" type="submit">Save name</button></div>
      </form>
      {leagues.map(l => (
        <section className="panel" key={l.id}>
          <div className="class-row"><h2>{l.name}</h2><span className="small">Code {l.code}</span></div>
          <div className="board-wrap"><table className="table league"><caption className="visually-hidden">{l.name}, this week</caption>
            <thead><tr><th scope="col" className="rank">Rank</th><th scope="col">Traveller</th><th scope="col" className="num c-days">Days</th><th scope="col" className="num">Today</th><th scope="col" className="num c-streak">Streak</th><th scope="col" className="num">Week</th></tr></thead>
            <tbody>{l.members.map((m, k) => (
              <tr key={k} className={m.you ? "is-you" : ""}><td className="rank">{ordinal(k + 1)}</td><td className="who"><span className="name">{m.name}</span>{m.you && <> <span className="you-tag">you</span></>}</td>
                <td className="num c-days">{m.played}/7</td><td className="num">{m.todayScore ?? "Not yet"}</td><td className="num c-streak">{m.streak}</td><td className="num total">{m.total}</td></tr>
            ))}</tbody></table></div>
          <div className="actions">
            <button className="btn btn--small" type="button" onClick={() => navigator.clipboard.writeText(`Join my Stamped league "${l.name}": ${invite(l)}`).then(() => setCopied(l.id), () => setCopied(""))}>{copied === l.id ? "Invite copied" : "Copy invite link"}</button>
            <button className="linkish" type="button" onClick={() => onLeave(l.id)}>Leave league</button>
          </div>
        </section>
      ))}
      {!leagues.length && <p className="small">You are not in a league yet. Start one and send friends the invite link, or join with a code a friend sent you.</p>}
      <section className="ledger">
        <form className="field" noValidate onSubmit={async e => { e.preventDefault(); const err = await onJoin(code); setJoinMsg(err ?? "Joined."); if (!err) setCode(""); }}>
          <h2>Join a league</h2>
          <label htmlFor="join-code">League code</label>
          <div className="entry-row"><input className="input" id="join-code" name="join-code" value={code} onChange={e => setCode(e.target.value)} maxLength={12} autoCapitalize="characters" spellCheck={false} aria-describedby="join-msg" /><button className="btn btn--primary" type="submit">Join</button></div>
          <p className="help" id="join-msg" role="status">{joinMsg}</p>
        </form>
        <form className="field" noValidate onSubmit={async e => { e.preventDefault(); const err = await onCreate(name); setCreateMsg(err ?? "League created. Copy the invite link and send it to friends."); if (!err) setName(""); }}>
          <h2>Start a league</h2>
          <label htmlFor="league-name">League name</label>
          <div className="entry-row"><input className="input" id="league-name" name="league-name" value={name} onChange={e => setName(e.target.value)} maxLength={24} placeholder="Friends league" aria-describedby="create-msg" /><button className="btn" type="submit">Create</button></div>
          <p className="help" id="create-msg" role="status">{createMsg}</p>
        </form>
      </section>
      <div className="actions"><button className="btn btn--primary" type="button" onClick={onBack}>Back to the flight</button></div>
    </div>
  );
}
