import type { NextRequest } from "next/server";
import { handle } from "@/server/http";
import { leaveLeague, myLeagues } from "@/server/service";

export const dynamic = "force-dynamic";

/** DELETE /api/leagues/:id: leave that league. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(req, async ({ db, playerId, today }) => { await leaveLeague(db, playerId, id); return myLeagues(db, playerId, today); });
}
