/**
 * Applies the SQL files in backend/migrations in filename order.
 *
 * Every migration is written to be idempotent, so re-running is safe. Each file
 * runs inside a transaction: a failure rolls that file back rather than leaving
 * the schema half-migrated.
 *
 * Usage: node scripts/migrate.mjs [fileName]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not configured. Add it to backend/.env.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

const migrationsDir = path.join(here, "..", "migrations");
const only = process.argv[2];
const files = (await fs.readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .filter((name) => !only || name === only)
  .sort();

if (files.length === 0) {
  console.error(only ? `Migration not found: ${only}` : "No migrations found.");
  process.exit(1);
}

let failed = false;
for (const file of files) {
  const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
  const client = await pool.connect();
  try {
    console.log(`\n▶ ${file}`);
    client.on("notice", (notice) => console.log(`   notice: ${notice.message}`));
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`✔ ${file} applied`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    failed = true;
    // Log PostgreSQL diagnostics only — never the connection string.
    console.error(`✖ ${file} failed`, {
      code: error.code,
      message: error.message,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
    });
    break;
  } finally {
    client.release();
  }
}

await pool.end();
process.exit(failed ? 1 : 0);
