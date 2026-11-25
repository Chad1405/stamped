import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { db } from "@/db";
import { gameToday, yesterdaysAnswers } from "@/server/service";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";   // it turns over at midnight in the game's time zone

const load = cache(async () => yesterdaysAnswers(await db(), gameToday()));
const longDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export async function generateMetadata(): Promise<Metadata> {
  const a = await load();
  return {
    title: a ? `${SITE.name} answers for flight ${a.flight}, ${longDate(a.date)}` : `${SITE.name} answers`,
    description: `Yesterday's ${SITE.name} answers: the country, city and final answer for all five stops, hidden until you tap. Today's flight is never shown here.`,
    alternates: { canonical: "/answers" },
  };
}

/** Yesterday's flight with its answers, so "Born There answer" searches land here rather than on someone else's site.
 *  Each answer sits behind a tap: yesterday is still free to play, and people arrive here mid-flight. */
export default async function Answers() {
  const a = await load();
  return (
    <main className="shell legal answers">
      <p><Link href="/">Play today&apos;s flight</Link></p>
      <h1>Yesterday&apos;s {SITE.name} answers</h1>
      {!a ? <p>There was no flight yesterday. Come back tomorrow for today&apos;s answers.</p> : <>
        <p>Flight {a.flight}, {longDate(a.date)}. Yesterday&apos;s flight is still free to play, so try it first if you haven&apos;t. Each answer stays hidden until you tap it. Today&apos;s answers go up here tomorrow.</p>
        {a.stops.map(({ round: r, gotCountry }, i) => (
          <section key={i}>
            <h2>Stop {i + 1}: {r.prompt}</h2>
            <figure>
              {r.postcard
                ? <blockquote lang={r.postcard.lang ?? "en"} dir="auto">{r.postcard.text}</blockquote>
                // eslint-disable-next-line @next/next/no-img-element -- clue photos are fixed-size local files; next/image adds nothing here
                : r.img && <img src={r.img} alt={r.alt ?? ""} width={960} height={720} loading={i ? "lazy" : undefined} />}
            </figure>
            <details>
              <summary>Show the answer</summary>
              <p><strong>{r.cityName}, {r.country}.</strong> {r.spotLabel} {r.spotName}.</p>
              {r.tells && <p>What gave it away: {r.tells}</p>}
              <p>{r.fact}</p>
              {gotCountry !== null && <p>{gotCountry}% of players named the country.</p>}
              {r.credit && <p className="small">Photo: <a href={r.credit.url} rel="noopener">{r.credit.title}</a> by {r.credit.author}, {r.credit.license}.</p>}
            </details>
          </section>
        ))}
      </>}
      <p><Link href="/">Play today&apos;s flight</Link></p>
    </main>
  );
}
