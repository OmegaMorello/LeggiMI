// ============================================================
//  bookRoutes.js  —  /api/books
//  Catalog browsing/search (all users) and catalog management
//  (admin only). Also CSV import/export and cover lookup (L3).
// ============================================================

import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { db } from "../db/db.js";

const router = Router();

// GET /api/books  -> list catalog, with search & filters

// query params: ?q= (title/author), ?author= ?genre= ?year=
// ?available=true  (Level 1 search, Level 2 filters)
// TODO: build the SQL query from the provided filters.
router.get("/", (req, res) => {
  const q = (req.query.q || "").trim();
  const author = (req.query.author || "").trim();
  const genre = (req.query.genre || "").trim();
  const year = parseInt(req.query.year) || null;
  const available = req.query.available === "true";

  const dbQuery = db.prepare(
    `SELECT * FROM books
     WHERE 1=1
       AND (:q = '' OR title LIKE '%' || :q || '%' OR author LIKE '%' || :q || '%')
       AND (:author = '' OR author LIKE '%' || :author || '%')
       AND (:genre = '' OR genre LIKE '%' || :genre || '%')
       AND (:year IS NULL OR year = :year)
       AND (:available = 0 OR EXISTS (
         SELECT 1 FROM copies WHERE copies.book_id = books.id AND copies.status = 'available'
       ))`,
  );

  const books = dbQuery.all({ q, author, genre, year, available: available ? 1 : 0 });

  res.json(books);
});

// GET /api/books/:id  -> book detail + copies availability (L1/L2)
// TODO: return the book plus how many copies are available.
router.get("/:id", (req, res) => {
  res.status(501).json({ error: "TODO: book detail" });
});

// POST /api/books  -> add a book (admin) (L1)
// TODO: requireAdmin; insert book; optionally create N copies.
router.post("/", (req, res) => {
  res.status(501).json({ error: "TODO: add book" });
});

// PUT /api/books/:id  -> edit a book (admin) (L1)
router.put("/:id", (req, res) => {
  res.status(501).json({ error: "TODO: edit book" });
});

// DELETE /api/books/:id  -> remove a book (admin) (L1)
router.delete("/:id", (req, res) => {
  res.status(501).json({ error: "TODO: delete book" });
});

// ---- Level 3 -----------------------------------------------

// GET /api/books/export/csv  -> download catalog as CSV (admin)
router.get("/export/csv", (req, res) => {
  res.status(501).json({ error: "TODO: export CSV" });
});

// POST /api/books/import/csv  -> upload a CSV to bulk-add books (admin)
// Uses multer for the file upload (see ROADMAP).
router.post("/import/csv", (req, res) => {
  res.status(501).json({ error: "TODO: import CSV" });
});

export default router;
