import type { NextRequest } from "next/server";
import type { Action } from "@/lib/game/engine";
import { body, handle } from "@/server/http";
import { act, HttpError } from "@/server/service";

export const dynamic = "force-dynamic";

function toAction(a: unknown): Action {
  const o = (a ?? {}) as Record<string, unknown>;
  if (o.type === "start") return { type: "start" };
  if (o.type === "guess" && typeof o.text === "string") return { type: "guess", text: o.text };
  if (o.type === "decide" && typeof o.deeper === "boolean") return { type: "decide", deeper: o.deeper };
  if (o.type === "timeout") return { type: "timeout", text: typeof o.text === "string" ? o.text : undefined };
  throw new HttpError(400, "Unknown action.");
}

/** POST /api/play {date, stop, action}: start a stop, guess, decide, or report the clock running out. */
export function POST(req: NextRequest) {
  return handle(req, async ({ db, playerId, today }) => {
    const b = await body(req);
    return act(db, playerId, typeof b.date === "string" ? b.date : today, Number(b.stop), toAction(b.action), today);
  });
}
