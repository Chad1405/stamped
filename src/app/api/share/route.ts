import type { NextRequest } from "next/server";
import { body, handle } from "@/server/http";
import { recordShare } from "@/server/service";

export const dynamic = "force-dynamic";

/** POST /api/share {date, via}: count a tap on a share button on the results screen. */
export function POST(req: NextRequest) {
  return handle(req, async ({ db, playerId }) => { const b = await body(req); return recordShare(db, playerId, b.date, b.via); });
}
