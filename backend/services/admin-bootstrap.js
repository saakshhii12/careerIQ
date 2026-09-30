import bcrypt from "bcrypt";
import { query } from "../db.js";

/**
 * Creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD if missing.
 * Never logs the password.
 */
export async function ensureAdminAccount() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("Admin account skipped: ADMIN_EMAIL / ADMIN_PASSWORD not set.");
    return;
  }

  const existing = await query("SELECT user_id, role FROM users WHERE email = $1", [email]);
  if (existing.rows.length) {
    const userId = existing.rows[0].user_id;
    if (existing.rows[0].role !== "admin") {
      await query("UPDATE users SET role = 'admin' WHERE user_id = $1", [userId]);
    }
    const adminRow = await query("SELECT admin_id FROM admins WHERE user_id = $1", [userId]);
    if (!adminRow.rows.length) {
      await query("INSERT INTO admins (user_id) VALUES ($1)", [userId]);
    }
    console.log("Admin account ready.");
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const inserted = await query(
    "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'admin') RETURNING user_id",
    ["CareerIQ Admin", email, hashed]
  );
  await query("INSERT INTO admins (user_id) VALUES ($1)", [inserted.rows[0].user_id]);
  console.log("Admin account created.");
}
