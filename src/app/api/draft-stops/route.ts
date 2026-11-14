import { handleSchedule } from "@vercel/schedules";
import { db } from "@/db";
import { draftStops } from "@/server/drafter";
import { sendAlert } from "@/server/http";

export const dynamic = "force-dynamic";
export const maxDuration = 300;   // every type drafts at once; a run is about two minutes

/** Runs weekly from vercel.json; private, so only Vercel's scheduler can call it. */
export const POST = handleSchedule(async () => {
  try {
    const { added, skipped } = await draftStops(await db());
    if (added || skipped.length) await sendAlert(`Stamped: ${added} new ${added === 1 ? "stop" : "stops"} to review`,
      `Approve them at /admin.${skipped.length ? `\n\nSkipped ${skipped.length}:\n${skipped.join("\n")}` : ""}`);
  } catch (e) {
    await sendAlert("Stamped: the weekly drafting job failed", String(e));
    throw e;
  }
});
