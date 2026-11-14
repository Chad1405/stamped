// Shared plumbing for the API routes: the anonymous player cookie, dev seeding, and error mapping.
import { NextResponse, type NextRequest } from "next/server";
import { db, type Db } from "@/db";
import { ensurePlayer, gameToday, HttpError, keepCalendar } from "./service";

const COOKIE = "stamped_pid";
const YEAR = 60 * 60 * 24 * 365;
let seededFor = "";

type Ctx = { db: Db; playerId: string; today: string };
export async function handle(req: NextRequest, fn: (ctx: Ctx) => Promise<unknown>) {
  try {
    const d = await db(), today = gameToday();
    if (seededFor !== today) { await keepCalendar(d, today); seededFor = today; }   // once per day per server, so a day still has a flight if the daily job failed
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

/** Always logged; emailed too once RESEND_API_KEY and ALERT_EMAIL are set. */
export async function sendAlert(subject: string, text: string) {
  console.error(`[alert] ${subject}. ${text}`);
  const key = process.env.RESEND_API_KEY, to = process.env.ALERT_EMAIL;
  if (!key || !to) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.ALERT_EMAIL_FROM || "Stamped <onboarding@resend.dev>", to, subject, text }),
  });
  if (!res.ok) console.error(`[alert] email failed: ${res.status} ${await res.text()}`);
}
