import { handleSchedule } from "@vercel/schedules";
import { db } from "@/db";
import { dailyCalendarCheck, gameToday } from "@/server/service";

export const dynamic = "force-dynamic";

/** Always logged; emailed too once RESEND_API_KEY and ALERT_EMAIL are set. */
async function warn(subject: string, text: string) {
  console.error(`[keep-calendar] ${subject}. ${text}`);
  const key = process.env.RESEND_API_KEY, to = process.env.ALERT_EMAIL;
  if (!key || !to) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.ALERT_EMAIL_FROM || "Stamped <onboarding@resend.dev>", to, subject, text }),
  });
  if (!res.ok) console.error(`[keep-calendar] email failed: ${res.status} ${await res.text()}`);
}

/** Runs daily from vercel.json; private, so only Vercel's scheduler can call it. */
export const POST = handleSchedule(async () => {
  try {
    await dailyCalendarCheck(await db(), gameToday(), warn);
  } catch (e) {
    await warn("Stamped: the daily calendar job failed", String(e));
    throw e;
  }
});
