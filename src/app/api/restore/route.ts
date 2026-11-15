import { NextResponse, type NextRequest } from "next/server";
import { body, handle, sendEmail } from "@/server/http";
import { redeemRestore, requestRestore } from "@/server/service";

export const dynamic = "force-dynamic";

/** POST /api/restore {email}: email a link that restores the archive pass on this browser. Always answers the same way. */
export function POST(req: NextRequest) {
  return handle(req, async ({ db }) => {
    await requestRestore(db, (await body(req)).email, (to, token) => sendEmail(to, "Restore your Born There archive pass",
      `Open this link in the browser you want to play on. It works once, within 30 minutes:\n\n${req.nextUrl.origin}/api/restore?token=${token}\n\nIf you didn't ask for this, you can ignore it.`));
    return { ok: true };
  });
}

/** GET /api/restore?token=…: the link from that email. */
export function GET(req: NextRequest) {
  return handle(req, async ({ db, playerId }) => {
    const ok = await redeemRestore(db, req.nextUrl.searchParams.get("token"), playerId);
    return NextResponse.redirect(new URL(ok ? "/?pass=1" : "/?pass=expired", req.nextUrl.origin), 303);
  });
}
