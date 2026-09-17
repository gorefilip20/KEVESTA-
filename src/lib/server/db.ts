import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { newDb, DataType } from "pg-mem";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";

const globalDb = globalThis as typeof globalThis & { __kevestaPool?: Pool; __kevestaDbReady?: Promise<void> };

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!globalDb.__kevestaPool) {
    if (process.env.DATABASE_URL === "pg-mem://local-integration") {
      const memory = newDb({ autoCreateForeignKeyIndices: true });
      memory.public.registerFunction({ name: "gen_random_uuid", returns: DataType.uuid, implementation: () => crypto.randomUUID() });
      const adapter = memory.adapters.createPg();
      globalDb.__kevestaPool = new adapter.Pool() as unknown as Pool;
      const schema = readFileSync(join(process.cwd(), "db/schema.sql"), "utf8").replace(/^create extension.*?;\s*/i, "");
      globalDb.__kevestaDbReady = globalDb.__kevestaPool.query(schema).then(() => undefined);
    } else {
      globalDb.__kevestaPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
      globalDb.__kevestaDbReady = Promise.resolve();
    }
  }
  return globalDb.__kevestaPool;
}

async function ready() { getPool(); await globalDb.__kevestaDbReady; }

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  await ready();
  const client = await getPool().connect();
  try { await client.query("begin"); const result = await work(client); await client.query("commit"); return result; }
  catch (error) { await client.query("rollback"); throw error; }
  finally { client.release(); }
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  await ready();
  return getPool().query<T>(text, values);
}
