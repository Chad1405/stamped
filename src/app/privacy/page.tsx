import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: `Privacy · ${SITE.name}`, description: `What ${SITE.name} keeps about you, and why.` };

export default function Privacy() {
  return (
    <main className="shell legal">
      <p><Link href="/">Back to {SITE.name}</Link></p>
      <h1>Privacy</h1>
      <p className="small">Last updated {SITE.updated}. {SITE.name} is run by {SITE.operator}.</p>

      <section>
        <h2>The short version</h2>
        <p>You play without an account. We keep your game progress so your streak and passport work, tied to one cookie in your browser. There are no ads and no analytics trackers, and we don&apos;t sell or share your data.</p>
      </section>

      <section>
        <h2>What we keep</h2>
        <ul>
          <li>A random player ID, stored in a cookie so the game recognises your browser.</li>
          <li>Your play: the guesses you type, your answers and choices, when you made them, and your scores.</li>
          <li>What that adds up to: your streak, lounge pass use, finished flights, and the countries, cities and stamps in your passport.</li>
          <li>If you use friends leagues: the name you choose and the leagues you join or start.</li>
        </ul>
        <p>We don&apos;t ask for your name, email or location, and we don&apos;t store your IP address in our database. Guesses are kept as you type them, so please don&apos;t type anything personal into the answer box.</p>
      </section>

      <section>
        <h2>Why</h2>
        <p>To run the game you asked to play: to stop each day&apos;s stops being replayed, keep your streak and passport, show your leagues, and work out figures like &ldquo;3 in 10 players named Morocco&rdquo; and &ldquo;better than 76% of players&rdquo;. Those figures are totals across everyone and never name anyone. We also look at totals, such as how many people play each day and come back, to improve the game.</p>
      </section>

      <section>
        <h2>Cookies and storage</h2>
        <ul>
          <li><strong>stamped_pid</strong>: your player ID. The game needs it to work; it lasts a year.</li>
          <li><strong>stamped:muted</strong>: saved in your browser if you turn the sound off. It never leaves your device.</li>
        </ul>
        <p>Both are needed for the game or remember a choice you made, so there&apos;s no consent banner. Their names come from the game&apos;s earlier name, Stamped.</p>
      </section>

      <section>
        <h2>Who else sees it</h2>
        <ul>
          <li><strong>Players in your leagues</strong> see your league name, scores and streak.</li>
          <li><strong>Vercel</strong> hosts the game and protects it from abuse. To do that it handles your IP address and keeps request logs for a short time.</li>
          <li><strong>Neon</strong> runs the database where your progress is kept.</li>
        </ul>
        <p>These services may store data outside your country, under their own data protection terms. Nobody else gets your data, and we never sell it.</p>
      </section>

      <section>
        <h2>How long</h2>
        <p>For as long as the game runs, unless you delete it first. Clearing your cookies disconnects you from your progress but doesn&apos;t delete it, so if you want it gone, delete it first as described below.</p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>Delete everything we keep about you with <strong>Delete my progress</strong> at the bottom of your Passport page. That removes your streak, passport, results and league places, and any league you started. Totals that never named you, like how many players got a stop right, stay as they are.</p>
        <p>You can also ask what we hold, have it corrected, or object to how it&apos;s used, by emailing <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. There are no accounts, so we can only find your data from the browser you play in, which makes the button the surest way. If you&apos;re unhappy with how we handle your data, you can complain to the data protection authority where you live. In the UK, that&apos;s the Information Commissioner&apos;s Office, at <a href="https://ico.org.uk">ico.org.uk</a>.</p>
      </section>

      <section>
        <h2>Children</h2>
        <p>{SITE.name} isn&apos;t aimed at children under 13, and we don&apos;t knowingly keep data about them.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If this changes, we&apos;ll update this page and the date at the top.</p>
      </section>
    </main>
  );
}
