import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { addDrafts, applyReviewForm, bankOverview, reviewStop, stopProblems } from "@/server/bank";
import { gameToday } from "@/server/service";
import type { Round } from "@/lib/game/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;   // a batch fetches and cleans a photo per stop

async function importBatch(f: FormData) {
  "use server";
  let msg: string;
  try {
    const { added, skipped } = await addDrafts(await db(), JSON.parse(String(f.get("drafts"))));
    msg = `Added ${added}.${skipped.length ? ` Skipped ${skipped.length}: ${skipped.join(" | ")}` : ""}`;
  } catch (e) { msg = `Couldn't read that batch: ${e instanceof Error ? e.message : e}`; }
  redirect(`/admin?msg=${encodeURIComponent(msg.slice(0, 1500))}`);
}

async function decide(decision: "approve" | "reject", f: FormData) {
  await reviewStop(await db(), String(f.get("id")), decision, r => applyReviewForm(r, f), gameToday());
  revalidatePath("/admin");
}
// one action per button: a shared action reading the button's value got no value through React's form handling, and every Reject approved
async function approve(f: FormData) { "use server"; await decide("approve", f); }
async function reject(f: FormData) { "use server"; await decide("reject", f); }

const safeLink = (url: string) => /^https?:\/\//.test(url) ? url : null;   // drafts are machine-written; never let one become a javascript: link

function Field({ name, label, value, long }: { name: string; label: string; value: string; long?: boolean }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {long ? <textarea className="input codebox" id={name} name={name} defaultValue={value} /> : <input className="input" id={name} name={name} defaultValue={value} />}
    </div>
  );
}

function StopCard({ id, round: r, note, source }: { id: string; round: Round; note: string; source: string }) {
  const problems = stopProblems(r), link = safeLink(source), photoPage = r.credit && safeLink(r.credit.url);
  return (
    <form className="bank-card">
      <button type="submit" disabled hidden aria-hidden="true" />{/* takes the Enter key, so pressing it in a field doesn't approve the stop */}
      <input type="hidden" name="id" value={id} />
      <div className="bank-clue">
        {r.postcard ? <blockquote lang={r.postcard.lang}>{r.postcard.text}</blockquote> : <img src={r.img} alt={r.alt ?? ""} width={960} height={720} loading="lazy" />}
        <p className="small"><strong>{r.type}</strong>{r.credit && <> · {photoPage ? <a href={photoPage} target="_blank" rel="noopener">{r.credit.title}</a> : r.credit.title} by {r.credit.author} ({r.credit.license})</>}</p>
        {note && <p className="small">{note}</p>}
        {link && <p className="small"><a href={link} target="_blank" rel="noopener">Where the fact came from</a></p>}
      </div>
      <div className="bank-fields">
        {problems.length > 0 && <ul className="bank-problems">{problems.map(p => <li key={p}>{p}</li>)}</ul>}
        <Field name="prompt" label="Clue" value={r.prompt} />
        {r.postcard ? <Field name="message" label="Message" value={r.postcard.text} long /> : <Field name="alt" label="Photo description (no place names)" value={r.alt ?? ""} />}
        <div className="bank-pair"><Field name="country" label="Country" value={r.country} /><Field name="airport" label="Airport" value={r.airport} /></div>
        <div className="bank-pair"><Field name="cityName" label="City" value={r.cityName} /><Field name="city" label="Accepted, comma-separated" value={r.city.join(", ")} /></div>
        <div className="bank-pair"><Field name="regionName" label="Region" value={r.regionName} /><Field name="region" label="Accepted, comma-separated" value={r.region.join(", ")} /></div>
        <div className="bank-pair"><Field name="spotLabel" label="Final question" value={r.spotLabel} /><Field name="spotWord" label="Short label" value={r.spotWord} /></div>
        <div className="bank-pair"><Field name="spotName" label="Final answer" value={r.spotName} /><Field name="spot" label="Accepted, comma-separated" value={r.spot.join(", ")} /></div>
        <Field name="fact" label="Fact" value={r.fact} long />
        <Field name="crowd" label="Who gets it: country, city, final (%)" value={r.crowd.join(", ")} />
        <div className="actions">
          <button className="btn btn--primary" type="submit" formAction={approve}>Approve</button>
          <button className="btn" type="submit" formAction={reject}>Reject</button>
        </div>
      </div>
    </form>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const { pending, waiting, calendar, realDays } = await bankOverview(await db(), gameToday());
  return (
    <main className="shell bank">
      <header>
        <h1>Stop bank</h1>
        <p>{realDays} of the next {calendar.length} days have a real flight. {pending.length} {pending.length === 1 ? "stop needs" : "stops need"} review.</p>
        <p className="small">Approved and waiting: {waiting.map(w => `${w.type} ${w.n}`).join(", ")}. A day needs one of each.</p>
      </header>
      {msg && <p className="bank-msg" role="status">{msg}</p>}

      <section className="panel">
        <h2>To review</h2>
        {pending.length ? pending.map(s => <StopCard key={s.id} id={s.id} round={s.round} note={s.note} source={s.source} />) : <p>Nothing waiting.</p>}
      </section>

      <section className="panel">
        <h2>Coming up</h2>
        <table className="bank-table">
          <thead><tr><th>Date</th><th>Flight</th><th>Content</th><th>Stops</th></tr></thead>
          <tbody>{calendar.map(d => <tr key={d.date}><td>{d.date}</td><td>{d.flight ?? "None"}</td><td>{!d.flight ? "Empty" : d.real ? "Real" : "Sample"}</td><td>{d.places.join(", ")}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Add a batch</h2>
        <form action={importBatch} className="field">
          <label htmlFor="drafts">Stops as JSON</label>
          <textarea className="input codebox" id="drafts" name="drafts" required rows={8} />
          <div className="actions"><button className="btn" type="submit">Add to review</button></div>
        </form>
      </section>
    </main>
  );
}
