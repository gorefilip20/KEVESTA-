import { Pool, type PoolClient, type QueryResultRow } from "pg";

const globalDb = globalThis as typeof globalThis & { __kevestaPool?: Pool };

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!globalDb.__kevestaPool) globalDb.__kevestaPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
  return globalDb.__kevestaPool;
}

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try { await client.query("begin"); const result = await work(client); await client.query("commit"); return result; }
  catch (error) { await client.query("rollback"); throw error; }
  finally { client.release(); }
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}
