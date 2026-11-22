import { NextResponse, type NextRequest } from "next/server";
import { body, handle, sendEmail, setPlayer, signOut } from "@/server/http";
import { requestSignIn, verifySignIn } from "@/server/service";

export const dynamic = "force-dynamic";

/** POST /api/restore {email}: email a pass holder a 6-digit sign-in code for this browser. Always answers the same way.
 *  The email holds no link: the code works only when typed into the browser that asked for it. */
export function POST(req: NextRequest) {
  return handle(req, async ({ db, playerId }) => {
    await requestSignIn(db, (await body(req)).email, playerId, (to, code) => sendEmail(to, `Your Born There sign-in code: ${code}`,
      `Your sign-in code is ${code.slice(0, 3)} ${code.slice(3)}\n\nType it into Born There in the browser where you asked for it. It works for 15 minutes.\n\nIf you didn't ask for this, you can ignore it: nobody can sign in without the code.`));
    return { ok: true };
  });
}

/** PUT /api/restore {email, code}: check the code and point this browser at the account's player. */
export function PUT(req: NextRequest) {
  return handle(req, async ({ db, playerId }) => {
    const b = await body(req);
    const home = await verifySignIn(db, b.email, b.code, playerId);
    const res = NextResponse.json({ ok: true });
    setPlayer(res, home);
    return res;
  });
}

/** GET /api/restore?token=…: sign-in links from before codes. They no longer sign anyone in. */
export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/?pass=expired", req.nextUrl.origin), 303);
}

/** DELETE /api/restore: sign this browser out. */
export function DELETE() {
  return signOut();
}
