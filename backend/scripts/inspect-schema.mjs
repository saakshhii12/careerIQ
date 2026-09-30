import dotenv from "dotenv";
import pg from "pg";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const databaseUrl = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl?.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

const tables = await pool.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' ORDER BY table_name`
);

console.log("=== TABLES ===");
for (const row of tables.rows) console.log(row.table_name);

console.log("\n=== COLUMNS ===");
const cols = await pool.query(
  `SELECT table_name, column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema = 'public'
   ORDER BY table_name, ordinal_position`
);
let current = null;
for (const row of cols.rows) {
  if (row.table_name !== current) {
    current = row.table_name;
    console.log(`\n[${current}]`);
  }
  console.log(
    `  ${row.column_name} : ${row.data_type}` +
      `${row.is_nullable === "NO" ? " NOT NULL" : ""}` +
      `${row.column_default ? ` DEFAULT ${row.column_default}` : ""}`
  );
}

console.log("\n=== CHECK CONSTRAINTS ===");
const checks = await pool.query(
  `SELECT rel.relname AS table_name, con.conname, pg_get_constraintdef(con.oid) AS def
   FROM pg_constraint con
   JOIN pg_class rel ON rel.oid = con.conrelid
   JOIN pg_namespace ns ON ns.oid = rel.relnamespace
   WHERE ns.nspname = 'public' AND con.contype = 'c'
   ORDER BY rel.relname`
);
for (const row of checks.rows) console.log(`${row.table_name}: ${row.def}`);

console.log("\n=== FOREIGN KEYS ===");
const fks = await pool.query(
  `SELECT rel.relname AS table_name, pg_get_constraintdef(con.oid) AS def
   FROM pg_constraint con
   JOIN pg_class rel ON rel.oid = con.conrelid
   JOIN pg_namespace ns ON ns.oid = rel.relnamespace
   WHERE ns.nspname = 'public' AND con.contype = 'f'
   ORDER BY rel.relname`
);
for (const row of fks.rows) console.log(`${row.table_name}: ${row.def}`);

console.log("\n=== ROW COUNTS ===");
for (const row of tables.rows) {
  const c = await pool.query(`SELECT COUNT(*)::int AS n FROM public."${row.table_name}"`);
  console.log(`${row.table_name}: ${c.rows[0].n}`);
}

await pool.end();
