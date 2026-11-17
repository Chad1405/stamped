import { NextResponse, type NextRequest } from "next/server";
import { handle } from "@/server/http";
import { fulfill, startCheckout } from "@/server/payments";

export const dynamic = "force-dynamic";

/** POST /api/checkout: start buying the archive pass; answers with Stripe's Checkout URL. */
export function POST(req: NextRequest) {
  return handle(req, ({ playerId }) => startCheckout(playerId, req.nextUrl.origin));
}

/** GET /api/checkout?session_id=…: where Stripe sends the buyer back. Records the sale straight away (the webhook does too), then opens the game. */
export function GET(req: NextRequest) {
  return handle(req, async ({ db }) => {
    const id = req.nextUrl.searchParams.get("session_id");
    const paid = id ? await fulfill(db, id).catch(e => { console.error(e); return false; }) : false;
    return NextResponse.redirect(new URL(paid ? "/?pass=1" : "/", req.nextUrl.origin), 303);
  });
}
