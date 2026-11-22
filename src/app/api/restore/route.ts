import { NextResponse, type NextRequest } from "next/server";
import { body, handle, sendEmail, setPlayer, signOut } from "@/server/http";
import { redeemSignIn, requestSignIn } from "@/server/service";

export const dynamic = "force-dynamic";

/** POST /api/restore {email}: email a pass holder a link that signs this browser in. Always answers the same way. */
export function POST(req: NextRequest) {
  return handle(req, async ({ db }) => {
    await requestSignIn(db, (await body(req)).email, (to, token) => sendEmail(to, "Sign in to Born There",
      `Open this link in the browser you want to play on. It signs you in there, with your archive pass, streak and passport. It works once, within 30 minutes:\n\n${req.nextUrl.origin}/api/restore?token=${token}\n\nIf you didn't ask for this, you can ignore it.`));
    return { ok: true };
  });
}

/** GET /api/restore?token=…: the link from that email. Points this browser at the account's player. */
export function GET(req: NextRequest) {
  return handle(req, async ({ db, playerId }) => {
    const home = await redeemSignIn(db, req.nextUrl.searchParams.get("token"), playerId);
    const res = NextResponse.redirect(new URL(home ? "/?pass=1" : "/?pass=expired", req.nextUrl.origin), 303);
    if (home) setPlayer(res, home);
    return res;
  });
}

/** DELETE /api/restore: sign this browser out. */
export function DELETE() {
  return signOut();
}
