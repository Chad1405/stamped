import type { NextRequest } from "next/server";
import { handle } from "@/server/http";
import { getDay } from "@/server/service";

export const dynamic = "force-dynamic";

/** GET /api/day?date=YYYY-MM-DD (default today): the clues, your progress, and reveals for finished stops. */
export function GET(req: NextRequest) {
  return handle(req, ({ db, playerId, today }) => getDay(db, playerId, req.nextUrl.searchParams.get("date") || today, today));
}
