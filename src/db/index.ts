// One database handle. With DATABASE_URL set it talks to hosted Postgres (Neon) through node-postgres;
// without it, an embedded Postgres (PGlite) keeps data in .data/pglite so local dev needs no install.
import fs from "node:fs";
import path from "node:path";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzleLite } from "drizzle-orm/pglite";
import { migrate as migrateLite } from "drizzle-orm/pglite/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/** Both drivers share Drizzle's Postgres database type, so the rest of the app never knows which one runs. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
const MIGRATIONS = path.join(process.cwd(), "drizzle");

/** `url` is the pooled connection for app traffic; `directUrl` (unpooled) runs migrations, as Neon advises. */
export async function createDb(opts: { url?: string; directUrl?: string; dataDir?: string } = {}): Promise<Db> {
  if (opts.url) {
    const { Client, Pool } = await import("pg");
    const { attachDatabasePool } = await import("@vercel/functions");
    const direct = new Client({ connectionString: opts.directUrl ?? opts.url });
    await direct.connect();
    try { await migratePg(drizzlePg(direct), { migrationsFolder: MIGRATIONS }); }
    finally { await direct.end(); }
    const pool = new Pool({ connectionString: opts.url });
    attachDatabasePool(pool);   // on Vercel Fluid compute, closes idle clients before the instance suspends
    return drizzlePg(pool, { schema }) as unknown as Db;
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
    ? { url: process.env.DATABASE_URL, directUrl: process.env.DATABASE_URL_UNPOOLED }
    : { dataDir: path.join(process.cwd(), ".data", "pglite") })
    .catch(e => { g.__stampedDb = undefined; throw e; });   // a failed start is retried on the next request, not cached
  return g.__stampedDb;
}
