import type { Metadata } from "next";
import Link from "next/link";
import { COUNTRY_MS, LADDER, MAX_DAY_SCORE, ROUND_MS, TIERS } from "@/lib/game/rules";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `How to play ${SITE.name}, ${SITE.tagline}`,
  description: `The rules of ${SITE.name}: five photos a day, ${COUNTRY_MS / 1000} seconds to name the country, then risk it for the city and a final question. Points, stamps and the archive pass explained.`,
  alternates: { canonical: "/how-to-play" },
};

// The questions people (and AI answers) ask about the game. The page shows them and the structured data repeats them word for word.
const FAQ: [string, string][] = [
  ["Is Born There free?", `Yes. Today's and yesterday's flights are free to play, with no sign-up and no ads. An optional archive pass (${SITE.passPrice}, paid once, not a subscription) opens every earlier flight.`],
  ["Do I need an account?", "No. Your streak, passport and leagues are kept for your browser without an account. If you buy the archive pass, the email you pay with becomes your sign-in: sign in on another device and your pass, streak and passport come with you."],
  ["How often is there a new game?", "Every day. There is one flight of five stops a day, and it is the same for every player, so you can compare scores with friends."],
  ["How is Born There different from GeoGuessr or Worldle?", "GeoGuessr drops you into Street View and Worldle shows a country's outline. Born There gives you five photos or messages from real places, and asks for the country first, then lets you risk your points to name the exact city and answer a final question."],
  ["Where do the photos come from?", "From Wikimedia Commons, under their own free licences. Each photo is credited with its answer once you have played that stop. Stops are drafted with help from AI and checked by a person before they go live."],
  ["Who makes Born There?", `${SITE.name} is made by ${SITE.operator}, a small independent studio in the UK. You can reach us at ${SITE.email}.`],
];

const STRUCTURED = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function HowToPlay() {
  return (
    <main className="shell legal">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED).replace(/</g, "\\u003c") }} />
      <p><Link href="/">Play today&apos;s flight</Link></p>
      <h1>How to play {SITE.name}</h1>
      <p>{SITE.name} is a free daily geography game. Each day there is one flight of five stops. Every stop is a photo or a message from somewhere real, and your job is to say where you landed.</p>

      <section>
        <h2>The rules</h2>
        <ol>
          <li><strong>Name the country.</strong> You have {COUNTRY_MS / 1000} seconds and three tries, with a clue after each miss. Every extra try takes 10 points off.</li>
          <li><strong>Risk it or stay.</strong> Get the country right and the Backpacker stamp is yours. Then choose: stay and keep it, or risk it for the city.</li>
          <li><strong>Go deeper.</strong> Name the city in {ROUND_MS / 1000} seconds, then risk it again for a final question about the place. A miss drops you a tier.</li>
        </ol>
      </section>

      <section>
        <h2>Stamps and points</h2>
        <p>Each stop earns a stamp. The best score for a day is {MAX_DAY_SCORE}.</p>
        <ul>
          {LADDER.map(id => <li key={id}><strong>{TIERS[id].name}</strong> ({TIERS[id].score} points): {TIERS[id].blurb}</li>)}
          <li><strong>{TIERS.miss.name}</strong> ({TIERS.miss.score} points): {TIERS.miss.blurb}</li>
        </ul>
      </section>

      <section>
        <h2>Streaks, passport and leagues</h2>
        <p>Play every day to build a streak. Every country and city you name goes into your passport. Start a friends league and send the code: leagues rank each week&apos;s daily flights, Monday to Sunday.</p>
      </section>

      <section>
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => <div key={q}><h3>{q}</h3><p>{a}</p></div>)}
      </section>

      <p><Link href="/">Play today&apos;s flight</Link></p>
    </main>
  );
}
