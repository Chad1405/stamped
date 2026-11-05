import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { Round, StopState } from "@/lib/game/engine";

/** Anonymous players: an unguessable id in an httpOnly cookie. Sign-in can attach to this row later. */
export const players = pgTable("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  passes: jsonb("passes").$type<string[]>().notNull().default([]),   // dates a lounge pass covered
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One itinerary per day. `rounds` holds the answers and never leaves the server unredacted. */
export const itineraries = pgTable("itineraries", {
  date: text("date").primaryKey(),   // YYYY-MM-DD in the game's time zone
  flight: text("flight").notNull(),
  rounds: jsonb("rounds").$type<Round[]>().notNull(),
});

/** A player's progress on one stop of one day. The engine's state lives here. */
export const plays = pgTable("plays", {
  playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  date: text("date").notNull().references(() => itineraries.date),
  stop: integer("stop").notNull(),
  state: jsonb("state").$type<StopState>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.playerId, t.date, t.stop] })]);

/** A finished day. `onTime` is true when it was flown on its own date, which is what streaks and leagues count. */
export const results = pgTable("results", {
  playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  date: text("date").notNull().references(() => itineraries.date),
  score: integer("score").notNull(),
  tiers: jsonb("tiers").$type<string[]>().notNull(),
  onTime: boolean("on_time").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.playerId, t.date] }), index("results_date_idx").on(t.date)]);

/** The lifetime passport: countries, cities and Born There finds, each stamped once. */
export const stamps = pgTable("stamps", {
  playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"country" | "city" | "rare">().notNull(),
  key: text("key").notNull(),
  firstDate: text("first_date").notNull(),
  meta: jsonb("meta").$type<Record<string, string>>().notNull().default({}),
}, t => [primaryKey({ columns: [t.playerId, t.kind, t.key] })]);

/** How far everyone got on each stop: the real crowd figures. */
export const stopStats = pgTable("stop_stats", {
  date: text("date").notNull(),
  stop: integer("stop").notNull(),
  players: integer("players").notNull().default(0),
  country: integer("country").notNull().default(0),
  city: integer("city").notNull().default(0),
  spot: integer("spot").notNull().default(0),
}, t => [primaryKey({ columns: [t.date, t.stop] })]);

/** Friend leagues, joined by invite code. */
export const leagues = pgTable("leagues", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const leagueMembers = pgTable("league_members", {
  leagueId: text("league_id").notNull().references(() => leagues.id, { onDelete: "cascade" }),
  playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.leagueId, t.playerId] }), index("league_members_player_idx").on(t.playerId)]);
