import type { NextRequest } from "next/server";
import { body, handle, sendEmail } from "@/server/http";
import { feedbackLastHour, sendFeedback } from "@/server/service";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const EMAILS_PER_HOUR = 20;   // a new player per request gets round the per-player limit, so the inbox has its own

/** POST /api/feedback {message, email?, context?}: keep a player's feedback for the admin page and email it to the team. */
export function POST(req: NextRequest) {
  return handle(req, async ({ db, playerId }) => {
    const f = await sendFeedback(db, playerId, await body(req), req.headers.get("user-agent"));
    const to = process.env.ALERT_EMAIL;
    if (to && process.env.RESEND_API_KEY && await feedbackLastHour(db) <= EMAILS_PER_HOUR) {
      const where = Object.entries(f.context).map(([k, v]) => `${k}: ${v}`).join("\n");
      // a failed email never loses the message: it is already saved for the admin page
      await sendEmail(to, `Born There feedback: ${f.message.replace(/\s+/g, " ").slice(0, 60)}`,
        `${f.message}\n\nReply to: ${f.email ?? "(no email given)"}\n\n${where}\n\nAll feedback: ${SITE.url}/admin`).catch(e => console.error("[feedback] email failed", e));
    }
    return { ok: true as const };
  });
}
