// Shared plumbing for the API routes: the anonymous player cookie, dev seeding, and error mapping.
import { NextResponse, type NextRequest } from "next/server";
import { db, type Db } from "@/db";
import { ensurePlayer, gameToday, HttpError, seedIfEmpty } from "./service";

const COOKIE = "stamped_pid";
const YEAR = 60 * 60 * 24 * 365;
let seeded = false;

type Ctx = { db: Db; playerId: string; today: string };
export async function handle(req: NextRequest, fn: (ctx: Ctx) => Promise<unknown>) {
  try {
    const d = await db(), today = gameToday();
    if (!seeded && process.env.SEED_SAMPLE !== "false") { await seedIfEmpty(d, today); seeded = true; }   // sample content until an editor tool exists
    const cookieId = req.cookies.get(COOKIE)?.value;
    const playerId = await ensurePlayer(d, cookieId);
    const res = NextResponse.json(await fn({ db: d, playerId, today }));
    if (playerId !== cookieId) res.cookies.set(COOKIE, playerId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: YEAR, path: "/" });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Something went wrong on our side. Try again in a moment." }, { status: 500 });
  }
}

/** Read a small JSON body; anything else is a 400. */
export async function body(req: NextRequest): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (text.length > 4000) throw new HttpError(413, "Request too large.");
  try { const v = JSON.parse(text || "{}"); if (v && typeof v === "object" && !Array.isArray(v)) return v; } catch {}
  throw new HttpError(400, "Expected a JSON object.");
}
