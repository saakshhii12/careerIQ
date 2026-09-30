import dotenv from "dotenv";
import pg from "pg";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const databaseUrl = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl?.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

const owned = await pool.query(
  `SELECT c.relname            AS seq_name,
          tab.relname          AS table_name,
          col.attname          AS column_name
   FROM pg_class c
   JOIN pg_depend d      ON d.objid = c.oid AND d.deptype = 'a'
   JOIN pg_class tab     ON tab.oid = d.refobjid
   JOIN pg_attribute col ON col.attrelid = tab.oid AND col.attnum = d.refobjsubid
   JOIN pg_namespace n   ON n.oid = c.relnamespace
   WHERE c.relkind = 'S' AND n.nspname = 'public'
   ORDER BY tab.relname`
);

console.log("seq_name | table.column | last_value | max(col) | STATUS");
const broken = [];
for (const row of owned.rows) {
  const seq = await pool.query(`SELECT last_value, is_called FROM public."${row.seq_name}"`);
  const max = await pool.query(
    `SELECT COALESCE(MAX("${row.column_name}"), 0)::bigint AS mx FROM public."${row.table_name}"`
  );
  const last = Number(seq.rows[0].last_value);
  const isCalled = seq.rows[0].is_called;
  const mx = Number(max.rows[0].mx);
  const nextVal = isCalled ? last + 1 : last;
  const bad = nextVal <= mx;
  if (bad) broken.push({ ...row, last, mx });
  console.log(
    `${row.seq_name} | ${row.table_name}.${row.column_name} | ${last} (is_called=${isCalled}) | ${mx} | ${
      bad ? "*** BROKEN — next insert collides ***" : "ok"
    }`
  );
}

console.log(`\nBROKEN SEQUENCES: ${broken.length}`);
for (const b of broken) console.log(`  ${b.table_name}.${b.column_name} (seq at ${b.last}, max ${b.mx})`);

await pool.end();
