import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { Round, StopState } from "@/lib/game/engine";

/** Anonymous players: an unguessable id in an httpOnly cookie. Sign-in can attach to this row later. */
export const players = pgTable("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  passes: jsonb("passes").$type<string[]>().notNull().default([]),   // dates a lounge pass covered
  unlocked: boolean("unlocked").notNull().default(false),            // holds the archive pass, bought here or restored by email
  voucherDates: jsonb("voucher_dates").$type<string[]>().notNull().default([]),   // days a streak milestone earned a boarding voucher
  voucherFlights: jsonb("voucher_flights").$type<string[]>().notNull().default([]),   // archive flights opened with one, for good
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Paid archive passes, one row per Stripe Checkout Session. Kept when a player deletes their progress: it's the record of a sale, and how a pass is restored. */
export const purchases = pgTable("purchases", {
  sessionId: text("session_id").primaryKey(),
  email: text("email").notNull(),   // lower-cased
  playerId: text("player_id").references(() => players.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("purchases_email_idx").on(t.email)]);

/** Pass holders' accounts: the email they paid with, pointing at the one player their progress lives on. Signing in on another
 *  browser points that browser at the same player. Deleting the player deletes the account (the purchase record stays). */
export const accounts = pgTable("accounts", {
  email: text("email").primaryKey(),   // lower-cased, as in purchases
  playerId: text("player_id").notNull().unique().references(() => players.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One-use sign-in codes, emailed to a pass holder and typed into the browser that asked for them. Only a hash of the code is kept.
 *  (The table keeps its first name, from when sign-in was an emailed restore link.) */
export const restoreTokens = pgTable("restore_tokens", {
  token: text("token").primaryKey(),                  // a random row id; the code itself is never stored
  email: text("email").notNull(),
  playerId: text("player_id").references(() => players.id, { onDelete: "cascade" }),   // the browser that asked; only it can use the code
  codeHash: text("code_hash"),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** One itinerary per day. `rounds` holds the answers and never leaves the server unredacted. */
export const itineraries = pgTable("itineraries", {
  date: text("date").primaryKey(),   // YYYY-MM-DD in the game's time zone
  flight: text("flight").notNull(),
  rounds: jsonb("rounds").$type<Round[]>().notNull(),
});

/** Stops waiting to be used. A person approves each one; the calendar only ever draws from approved stops. */
export const stopBank = pgTable("stop_bank", {
  id: text("id").primaryKey(),
  status: text("status").$type<"pending" | "approved" | "rejected">().notNull().default("pending"),
  round: jsonb("round").$type<Round>().notNull(),
  note: text("note").notNull().default(""),       // for the reviewer, e.g. what a Language stop's message says in English
  source: text("source").notNull().default(""),   // where the fact came from
  usedOn: text("used_on").references(() => itineraries.date),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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

/** Shares from the results screen: one row per player, flight and channel, however many times they tap. */
export const shares = pgTable("shares", {
  playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  via: text("via").$type<"native" | "whatsapp" | "messages" | "x" | "copy">().notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.playerId, t.date, t.via] })]);

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

/** How many players finished each flight with each score. A trigger on results keeps it (migration 0007),
 *  so "you beat X%" reads a few rows instead of counting every result for the day. */
export const scoreCounts = pgTable("score_counts", {
  date: text("date").notNull(),
  score: integer("score").notNull(),
  n: integer("n").notNull(),
}, t => [primaryKey({ columns: [t.date, t.score] })]);

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
