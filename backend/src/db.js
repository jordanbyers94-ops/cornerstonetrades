import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data.sqlite");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS tradies (
    id TEXT PRIMARY KEY,
    trade TEXT NOT NULL,
    business_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    suburb TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'QLD',
    phone TEXT,
    email TEXT NOT NULL,
    license_number TEXT,
    licensing_body TEXT,
    story TEXT,
    photo_url TEXT,
    referred_by TEXT,
    public_directory INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
    license_verified_at TEXT,
    next_reverification_due TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tradies_trade ON tradies(trade);
  CREATE INDEX IF NOT EXISTS idx_tradies_suburb ON tradies(suburb);
  CREATE INDEX IF NOT EXISTS idx_tradies_status ON tradies(status);

  -- Public audit trail: every verification/re-verification event, so a
  -- customer or admin can see the history behind the "verified" seal.
  CREATE TABLE IF NOT EXISTS verification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tradie_id TEXT NOT NULL,
    verified_at TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY (tradie_id) REFERENCES tradies(id)
  );

  CREATE INDEX IF NOT EXISTS idx_verification_log_tradie ON verification_log(tradie_id);
`);

// Lightweight migration for databases created before photo_url/referred_by existed.
const existingCols = db.prepare("PRAGMA table_info(tradies)").all().map((c) => c.name);
if (!existingCols.includes("photo_url")) {
  db.exec("ALTER TABLE tradies ADD COLUMN photo_url TEXT");
}
if (!existingCols.includes("referred_by")) {
  db.exec("ALTER TABLE tradies ADD COLUMN referred_by TEXT");
}
