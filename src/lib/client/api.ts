// Typed calls to the game's API. Types come straight from the server functions, so the two cannot drift.
import type { act, getDay, getMe, myLeagues } from "@/server/service";
import type { Action } from "@/lib/game/engine";

export type Day = Awaited<ReturnType<typeof getDay>>;
export type StopData = Day["stops"][number];
export type Me = Awaited<ReturnType<typeof getMe>>;
export type League = Awaited<ReturnType<typeof myLeagues>>[number];
export type ActResult = Awaited<ReturnType<typeof act>>;

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try { res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers }, cache: "no-store" }); }
  catch { throw new ApiError(0, "Can't reach the game right now. Check your connection and try again."); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Something went wrong. Try again.");
  return data as T;
}

export const api = {
  day: (date?: string) => call<Day>(`/api/day${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  play: (date: string, stop: number, action: Action) => call<ActResult>("/api/play", { method: "POST", body: JSON.stringify({ date, stop, action }) }),
  me: () => call<Me>("/api/me"),
  rename: (name: string) => call<Me>("/api/me", { method: "PATCH", body: JSON.stringify({ name }) }),
  leagues: () => call<League[]>("/api/leagues"),
  createLeague: (name: string) => call<{ joined: string; leagues: League[] }>("/api/leagues", { method: "POST", body: JSON.stringify({ name }) }),
  joinLeague: (code: string) => call<{ joined: string; leagues: League[] }>("/api/leagues", { method: "POST", body: JSON.stringify({ code }) }),
  leaveLeague: (id: string) => call<League[]>(`/api/leagues/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
