import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Resolve .env relative to this file. ES module imports are evaluated before
// the importing module's body, so server.js's dotenv.config() runs too late to
// configure this pool — and a cwd-relative lookup silently falls back to
// localhost when the server is started from the repository root.
dotenv.config({ path: fileURLToPath(new URL(".env", import.meta.url)) });

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: databaseUrl,
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "career_iq",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  ssl: databaseUrl?.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export async function query(text, params) {
  return pool.query(text, params);
}

/** Runs `fn` inside a transaction, rolling back on any thrown error. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * PostgreSQL diagnostics that are safe to write to the server log. Deliberately
 * excludes anything that could carry the connection string, credentials, or row
 * data — `error.message` and `error.detail` are included because pg populates
 * them with constraint names and column names, not secrets.
 */
export function dbErrorDetails(error) {
  return {
    code: error?.code,
    message: error?.message,
    detail: error?.detail,
    constraint: error?.constraint,
    table: error?.table,
    column: error?.column,
    routine: error?.routine,
  };
}

export default pool;
