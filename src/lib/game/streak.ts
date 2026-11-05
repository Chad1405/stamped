// Streaks with grace: one lounge pass a week covers a single missed day. Pure, so the server and tests share it.
import { MILESTONES } from "./rules";

export const dkey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
export const addDays = (key: string, n: number) => { const [y, m, d] = key.split("-").map(Number); return dkey(new Date(Date.UTC(y, m - 1, d + n))); };
/** The Monday of the week a date falls in. */
export const weekOf = (key: string) => { const [y, m, d] = key.split("-").map(Number); const t = new Date(Date.UTC(y, m - 1, d)); return addDays(key, -((t.getUTCDay() + 6) % 7)); };

export type StreakInfo = { n: number; playedToday: boolean; pending: string | null; usedThisWeek: string | null; passLeft: boolean; next: number | null; milestone: number | null; spend: string | null };

/** `played` holds the dates whose daily flight was finished on that day. `passes` holds dates already covered by a pass. */
export function streakInfo(played: Set<string>, passes: string[], today: string): StreakInfo {
  const playedToday = played.has(today);
  let day = playedToday ? today : addDays(today, -1);   // an unflown today does not break the streak yet
  let n = 0, saved: string | null = null;
  for (let guard = 0; guard < 4000; guard++) {
    if (played.has(day)) { n++; day = addDays(day, -1); continue; }
    if (passes.includes(day)) { day = addDays(day, -1); continue; }
    const newer = n > 0 || !playedToday;   // a newer day was flown, or today still can be
    if (!saved && newer && played.has(addDays(day, -1)) && !passes.some(p => weekOf(p) === weekOf(day))) { saved = day; day = addDays(day, -1); continue; }
    break;
  }
  const usedThisWeek = passes.find(p => weekOf(p) === weekOf(today)) ?? (saved && weekOf(saved) === weekOf(today) ? saved : null);
  return {
    n, playedToday, pending: saved && !playedToday ? saved : null, usedThisWeek, passLeft: !usedThisWeek,
    next: MILESTONES.find(m => m > n) ?? null, milestone: playedToday && MILESTONES.includes(n) ? n : null,
    spend: saved && playedToday ? saved : null,   // the caller records this pass once today is flown
  };
}
