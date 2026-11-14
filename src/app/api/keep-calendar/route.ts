import { handleSchedule } from "@vercel/schedules";
import { db } from "@/db";
import { sendAlert as warn } from "@/server/http";
import { dailyCalendarCheck, gameToday } from "@/server/service";

export const dynamic = "force-dynamic";

/** Runs daily from vercel.json; private, so only Vercel's scheduler can call it. */
export const POST = handleSchedule(async () => {
  try {
    await dailyCalendarCheck(await db(), gameToday(), warn);
  } catch (e) {
    await warn("Stamped: the daily calendar job failed", String(e));
    throw e;
  }
});
