import type { NextRequest } from "next/server";
import { body, forget, handle } from "@/server/http";
import { getMe, setName } from "@/server/service";

export const dynamic = "force-dynamic";

/** GET /api/me: streak, lounge pass, record, lifetime passport and recent flights. */
export function GET(req: NextRequest) {
  return handle(req, ({ db, playerId, today }) => getMe(db, playerId, today));
}

/** DELETE /api/me: delete everything kept about this player (the button on the Passport page). */
export function DELETE(req: NextRequest) {
  return forget(req);
}

/** PATCH /api/me {name}: the name friends see on league boards. */
export function PATCH(req: NextRequest) {
  return handle(req, async ({ db, playerId, today }) => { await setName(db, playerId, (await body(req)).name); return getMe(db, playerId, today); });
}
