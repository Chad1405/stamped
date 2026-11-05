import type { NextRequest } from "next/server";
import { body, handle } from "@/server/http";
import { getMe, setName } from "@/server/service";

export const dynamic = "force-dynamic";

/** GET /api/me: streak, lounge pass, record, lifetime passport and recent flights. */
export function GET(req: NextRequest) {
  return handle(req, ({ db, playerId, today }) => getMe(db, playerId, today));
}

/** PATCH /api/me {name}: the name friends see on league boards. */
export function PATCH(req: NextRequest) {
  return handle(req, async ({ db, playerId, today }) => { await setName(db, playerId, (await body(req)).name); return getMe(db, playerId, today); });
}
