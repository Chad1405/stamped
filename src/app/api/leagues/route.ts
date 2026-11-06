import type { NextRequest } from "next/server";
import { body, handle } from "@/server/http";
import { createLeague, joinLeague, myLeagues } from "@/server/service";

export const dynamic = "force-dynamic";

/** GET /api/leagues: your leagues with this week's boards. */
export function GET(req: NextRequest) {
  return handle(req, ({ db, playerId, today }) => myLeagues(db, playerId, today));
}

/** POST /api/leagues {name} creates a league; {code} joins one. Either way the boards come back. */
export function POST(req: NextRequest) {
  return handle(req, async ({ db, playerId, today }) => {
    const b = await body(req);
    const id = typeof b.code === "string" ? await joinLeague(db, playerId, b.code) : await createLeague(db, playerId, b.name);
    return { joined: id, leagues: await myLeagues(db, playerId, today) };
  });
}
