import dotenv from "dotenv";
import pg from "pg";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const databaseUrl = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl?.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

const r = await pool.query(
  `SELECT table_name, column_name, is_nullable, is_identity, identity_generation, column_default
   FROM information_schema.columns
   WHERE table_schema='public'
     AND table_name IN ('quiz_questions','quiz_answers','quiz_attempts','notifications','applications','interview_sessions')
   ORDER BY table_name, ordinal_position`
);
for (const row of r.rows) {
  console.log(
    `${row.table_name}.${row.column_name} | nullable=${row.is_nullable} | identity=${row.is_identity}${
      row.identity_generation ? `(${row.identity_generation})` : ""
    } | default=${row.column_default ?? "-"}`
  );
}

console.log("\n--- unique indexes on quiz/applications/notifications ---");
const idx = await pool.query(
  `SELECT tablename, indexname, indexdef FROM pg_indexes
   WHERE schemaname='public' AND tablename IN ('quiz_answers','quiz_questions','applications','interview_answers','notifications')
   ORDER BY tablename`
);
for (const row of idx.rows) console.log(`${row.tablename}: ${row.indexdef}`);

await pool.end();
