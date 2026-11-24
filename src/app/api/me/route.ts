import type { NextRequest } from "next/server";
import { body, forget, handle } from "@/server/http";
import { getMe, setLook, setName, setSource } from "@/server/service";

export const dynamic = "force-dynamic";

/** GET /api/me: streak, lounge pass, record, lifetime passport and recent flights. */
export function GET(req: NextRequest) {
  return handle(req, ({ db, playerId, today }) => getMe(db, playerId, today));
}

/** DELETE /api/me: delete everything kept about this player (the button on the Passport page). */
export function DELETE(req: NextRequest) {
  return forget(req);
}

/** PATCH /api/me {name} sets the name friends see on league boards; {source} records where a new player came from; {look} which theme their browser shows. */
export function PATCH(req: NextRequest) {
  return handle(req, async ({ db, playerId, today }) => {
    const b = await body(req);
    if (b.source !== undefined) await setSource(db, playerId, b.source);
    if (b.look !== undefined) await setLook(db, playerId, b.look);
    if (b.name !== undefined) await setName(db, playerId, b.name);
    return getMe(db, playerId, today);
  });
}
