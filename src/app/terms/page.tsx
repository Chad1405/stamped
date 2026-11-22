import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: `Terms · ${SITE.name}`, description: `The rules for playing ${SITE.name}.` };

export default function Terms() {
  return (
    <main className="shell legal">
      <p><Link href="/">Back to {SITE.name}</Link></p>
      <h1>Terms</h1>
      <p className="small">Last updated {SITE.updated}. {SITE.name} is run by {SITE.operator}. By playing, you agree to these terms.</p>

      <section>
        <h2>The game</h2>
        <p>{SITE.name} is free to play each day. We work to keep it running and correct, but we provide it as it is: it may change, have mistakes or downtime, and we may stop running it.</p>
      </section>

      <section>
        <h2>The archive pass</h2>
        <p>Today&apos;s and yesterday&apos;s flights are free. The archive pass, a one-time payment, opens every earlier flight for as long as the game runs. Payment is taken by Stripe as the seller, through its merchant of record service, under its own terms. The email you paid with is your sign-in: sign in with it on any device to use the pass there. Keep that email account secure, because anyone who can read it can sign in as you. For refunds or payment questions, contact us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>; your rights as a consumer aren&apos;t affected.</p>
      </section>

      <section>
        <h2>Playing fair</h2>
        <ul>
          <li>Play each day&apos;s flight yourself. Scores and leagues only mean something if everyone does.</li>
          <li>Don&apos;t use scripts or bots, try to get answers before you play, or overload the game.</li>
          <li>Keep league and player names decent. We may change or remove names that aren&apos;t.</li>
        </ul>
        <p>We may limit or remove access for anyone who breaks these rules.</p>
      </section>

      <section>
        <h2>Photos and facts</h2>
        <p>Clue photos come from Wikimedia Commons under their own free licences, and each is credited once you&apos;ve played its stop. Facts are drawn from Wikipedia. Stops are drafted with help from AI and checked by a person before they go live, but mistakes can slip through. If you spot one, tell us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      </section>

      <section>
        <h2>Our part</h2>
        <p>The game&apos;s design, code and writing belong to {SITE.operator}. Please don&apos;t copy them.</p>
        <p>As far as the law allows, we aren&apos;t responsible for losses from using the game or from it being unavailable. Nothing here takes away rights you have by law as a consumer.</p>
      </section>

      <section>
        <h2>Changes and law</h2>
        <p>We may update these terms; the date at the top shows when. These terms are governed by the law of {SITE.country}.</p>
        <p>Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. How we handle your data is on the <Link href="/privacy">privacy page</Link>.</p>
      </section>
    </main>
  );
}
