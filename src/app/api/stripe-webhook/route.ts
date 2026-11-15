import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { handleWebhook } from "@/server/payments";
import { HttpError } from "@/server/service";

export const dynamic = "force-dynamic";

/** POST /api/stripe-webhook: Stripe's notice of a sale. A 500 makes Stripe retry, so a database hiccup never loses one. */
export async function POST(req: NextRequest) {
  try {
    await handleWebhook(await db(), await req.text(), req.headers.get("stripe-signature") ?? "");
    return NextResponse.json({ received: true });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
