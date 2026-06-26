// ============================================================
//  db.js  —  SQLite connection (better-sqlite3)
//  Opens a single shared connection and runs schema.sql once.
//  Import `db` anywhere you need to query the database.
// ============================================================

import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// __dirname is not available with ES modules, so we rebuild it.
const __dirname = dirname(fileURLToPath(import.meta.url));

// The database file lives next to this script (library.db).
// It is git-ignored: it gets created automatically on first run.
const dbPath = join(__dirname, "library.db");

export const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

// Run the schema (CREATE TABLE IF NOT EXISTS ... is idempotent).
const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

console.log("Database ready:", dbPath);
