import type { NextRequest } from "next/server";
import { body, handle } from "@/server/http";
import { spendVoucher } from "@/server/service";

export const dynamic = "force-dynamic";

/** POST /api/voucher {date}: spend a boarding voucher on one locked archive flight. Returns the player's record. */
export function POST(req: NextRequest) {
  return handle(req, async ({ db, playerId, today }) => spendVoucher(db, playerId, (await body(req)).date, today));
}
