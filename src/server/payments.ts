// Stripe's side of the archive pass: Checkout for buying it, and the webhook that records each sale.
import Stripe from "stripe";
import type { Db } from "@/db";
import { HttpError, recordPurchase } from "./service";

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(503, "Payments aren't set up yet.");
  return new Stripe(key);
}

/** A hosted Checkout page for the pass, tied to this player. Managed Payments makes Stripe the seller, so it handles VAT and sales tax. */
export async function startCheckout(playerId: string, origin: string) {
  const price = process.env.STRIPE_PRICE_ID;
  if (!price) throw new HttpError(503, "Payments aren't set up yet.");
  const s = await stripe().checkout.sessions.create({
    mode: "payment", line_items: [{ price, quantity: 1 }], client_reference_id: playerId,
    managed_payments: { enabled: true }, integration_identifier: "born-there-archive-pass-qzmvkrta",
    success_url: `${origin}/api/checkout?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/`,
  });
  return { url: s.url };
}

/** Records a session once it's paid. Asks Stripe rather than trusting the caller, so the return page can't fake a sale. */
export async function fulfill(db: Db, sessionId: string) {
  const s = await stripe().checkout.sessions.retrieve(sessionId);
  if (s.payment_status === "unpaid") return false;   // a delayed payment method: the webhook calls again when it succeeds
  await recordPurchase(db, { sessionId: s.id, email: s.customer_details?.email ?? "", playerId: s.client_reference_id });
  return true;
}

/** Verifies Stripe's signature, then fulfils completed sessions. Anything else is acknowledged and ignored. */
export async function handleWebhook(db: Db, raw: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new HttpError(503, "Webhook secret isn't set.");
  let event: Stripe.Event;
  try { event = stripe().webhooks.constructEvent(raw, signature, secret); }
  catch { throw new HttpError(400, "Bad signature."); }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") await fulfill(db, event.data.object.id);
}
