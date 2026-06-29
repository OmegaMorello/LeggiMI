-- ============================================================
--  Database schema for the Library / Loans project
--  One file = the full data model. Run once at startup.
-- ============================================================

PRAGMA foreign_keys = ON;

-- ---- Users -------------------------------------------------
-- Registered users. role = 'user' (default) or 'admin' (librarian).
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'user',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---- Books -------------------------------------------------
-- One row per title (the catalog entry, not the physical item).
CREATE TABLE IF NOT EXISTS books (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  title          TEXT    NOT NULL,
  title_original TEXT,             -- original-language title (for cover lookup)
  author         TEXT    NOT NULL,
  genre          TEXT,
  year           INTEGER,
  isbn           TEXT,
  cover_url      TEXT,             -- filled from external API (Level 3)
  description    TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---- Copies ------------------------------------------------
-- Physical copies of a book (Level 2: multiple copies per title).
-- status: 'available' | 'on_loan'
CREATE TABLE IF NOT EXISTS copies (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  code    TEXT,                -- optional inventory code
  status  TEXT    NOT NULL DEFAULT 'available'
);

-- ---- Loans -------------------------------------------------
-- A loan links one copy to one user, with dates and status.
-- status: 'active' | 'returned' | 'overdue'
CREATE TABLE IF NOT EXISTS loans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  copy_id     INTEGER NOT NULL REFERENCES copies(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date  TEXT    NOT NULL DEFAULT (date('now')),
  due_date    TEXT    NOT NULL,                -- start_date + loan period
  return_date TEXT,                            -- NULL until returned
  status           TEXT    NOT NULL DEFAULT 'active',
  reminder_sent_at TEXT
);

-- ---- Reservations ------------------------------------------
-- Queue for a book when no copy is available (Level 2).
-- Position in the queue is derived from created_at ordering.
-- status: 'waiting' | 'fulfilled' | 'cancelled'
CREATE TABLE IF NOT EXISTS reservations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT    NOT NULL DEFAULT 'waiting',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Helpful indexes for the most frequent lookups.
CREATE INDEX IF NOT EXISTS idx_copies_book        ON copies(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_user         ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_copy         ON loans(copy_id);
CREATE INDEX IF NOT EXISTS idx_reservations_book  ON reservations(book_id);
