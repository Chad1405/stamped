// Shared plumbing for the API routes: the anonymous player cookie, dev seeding, and error mapping.
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, type Db } from "@/db";
import { itineraries } from "@/db/schema";
import { ensurePlayer, forgetPlayer, gameToday, HttpError, keepCalendar } from "./service";

const COOKIE = "stamped_pid";
const YEAR = 60 * 60 * 24 * 365;
let seededFor = "";

type Ctx = { db: Db; playerId: string; today: string };
export async function handle(req: NextRequest, fn: (ctx: Ctx) => Promise<unknown>) {
  try {
    const d = await db(), today = gameToday();
    if (seededFor !== today) {   // once per day per server, so a day still has a flight if the daily job failed
      // on Vercel the daily job does the full top-up; a new server only looks for today's flight, so a spike of new servers doesn't queue on the bank's lock
      if (!process.env.VERCEL || !(await d.select({ date: itineraries.date }).from(itineraries).where(eq(itineraries.date, today))).length) await keepCalendar(d, today);
      seededFor = today;
    }
    const cookieId = req.cookies.get(COOKIE)?.value;
    const playerId = await ensurePlayer(d, cookieId);
    const out = await fn({ db: d, playerId, today });
    const res = out instanceof NextResponse ? out : NextResponse.json(out);   // a route may answer with a redirect instead of JSON
    if (playerId !== cookieId && !res.cookies.get(COOKIE)) setPlayer(res, playerId);   // a sign-in has already pointed the cookie at its account
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Something went wrong on our side. Try again in a moment." }, { status: 500 });
  }
}

/** Points this browser's cookie at a player. */
export function setPlayer(res: NextResponse, playerId: string) {
  res.cookies.set(COOKIE, playerId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: YEAR, path: "/" });
}

/** Signs this browser out: drops the cookie and keeps everything, so signing in again brings it all back. */
export function signOut() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}

/** Deletes the player behind this browser's cookie and the cookie itself; the next visit starts a new, empty player. */
export async function forget(req: NextRequest) {
  const id = req.cookies.get(COOKIE)?.value;
  if (id) await forgetPlayer(await db(), id);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}

/** Read a small JSON body; anything else is a 400. */
export async function body(req: NextRequest): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (text.length > 4000) throw new HttpError(413, "Request too large.");
  try { const v = JSON.parse(text || "{}"); if (v && typeof v === "object" && !Array.isArray(v)) return v; } catch {}
  throw new HttpError(400, "Expected a JSON object.");
}

/** Sends an email through Resend. Without RESEND_API_KEY (local dev) it only logs, so a restore link can still be followed from the console. */
export async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.log(`[email] to ${to}: ${subject}. ${text}`); return; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.ALERT_EMAIL_FROM || "Born There <onboarding@resend.dev>", to, subject, text }),
  });
  if (!res.ok) console.error(`[email] failed: ${res.status} ${await res.text()}`);
}

/** Always logged; emailed too once RESEND_API_KEY and ALERT_EMAIL are set. */
export async function sendAlert(subject: string, text: string) {
  console.error(`[alert] ${subject}. ${text}`);
  const to = process.env.ALERT_EMAIL;
  if (to && process.env.RESEND_API_KEY) await sendEmail(to, subject, text);
}
