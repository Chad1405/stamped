// One database handle. With DATABASE_URL set it talks to hosted Postgres (Neon, Supabase, RDS...);
// without it, an embedded Postgres (PGlite) keeps data in .data/pglite so local dev needs no install.
import fs from "node:fs";
import path from "node:path";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import { drizzle as drizzleLite } from "drizzle-orm/pglite";
import { migrate as migrateLite } from "drizzle-orm/pglite/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/** Both drivers share Drizzle's Postgres database type, so the rest of the app never knows which one runs. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
const MIGRATIONS = path.join(process.cwd(), "drizzle");

export async function createDb(opts: { url?: string; dataDir?: string } = {}): Promise<Db> {
  if (opts.url) {
    const { default: postgres } = await import("postgres");
    const db = drizzlePg(postgres(opts.url, { max: 5, prepare: false }), { schema });
    await migratePg(db, { migrationsFolder: MIGRATIONS });
    return db as unknown as Db;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  if (opts.dataDir) fs.mkdirSync(path.dirname(opts.dataDir), { recursive: true });   // PGlite creates its own folder but not the parent
  const db = drizzleLite(new PGlite(opts.dataDir), { schema });   // no dataDir: in memory, for tests
  await migrateLite(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Db;
}

// One shared handle per server process (Next.js dev reloads modules, so keep it on globalThis).
const g = globalThis as unknown as { __stampedDb?: Promise<Db> };
export function db(): Promise<Db> {
  g.__stampedDb ??= createDb(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : { dataDir: path.join(process.cwd(), ".data", "pglite") })
    .catch(e => { g.__stampedDb = undefined; throw e; });   // a failed start is retried on the next request, not cached
  return g.__stampedDb;
}
