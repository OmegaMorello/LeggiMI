import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { db } from "../db/db.js";

const router = Router();

// POST /api/reservations  -> reserve a book (only if no copies available)
router.post("/", requireAuth, (req, res) => {
  const bookId = req.body.bookId;
  if (!bookId) return res.status(400).json({ error: "bookId mancante" });

  try {
    const book = db.prepare("SELECT id FROM books WHERE id = ?").get(bookId);
    if (!book) return res.status(404).json({ error: "Libro non trovato" });

    const available = db.prepare(
      "SELECT id FROM copies WHERE book_id = ? AND status = 'available' LIMIT 1"
    ).get(bookId);
    if (available) {
      return res.status(409).json({ error: "Ci sono copie disponibili, effettua il prestito" });
    }

    const existing = db.prepare(
      "SELECT id FROM reservations WHERE book_id = ? AND user_id = ? AND status = 'waiting'"
    ).get(bookId, req.session.user.id);
    if (existing) {
      return res.status(409).json({ error: "Hai già una prenotazione attiva per questo libro" });
    }

    const result = db.prepare(
      "INSERT INTO reservations (book_id, user_id, status, created_at) VALUES (?, ?, 'waiting', datetime('now'))"
    ).run(bookId, req.session.user.id);

    const reservation = db.prepare("SELECT * FROM reservations WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reservations/mine  -> current user's reservations with queue position
router.get("/mine", requireAuth, (req, res) => {
  try {
    const reservations = db.prepare(
      `SELECT r.*, books.title, books.cover_url, books.author
       FROM reservations r
       JOIN books ON r.book_id = books.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`
    ).all(req.session.user.id);

    const withPosition = reservations.map((r) => {
      if (r.status !== "waiting") return { ...r, position: null };
      const pos = db.prepare(
        `SELECT COUNT(*) as pos FROM reservations
         WHERE book_id = ? AND status = 'waiting' AND created_at <= ?`
      ).get(r.book_id, r.created_at);
      return { ...r, position: pos.pos };
    });

    res.json(withPosition);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/reservations/:id  -> cancel (soft delete)
router.delete("/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const reservation = db.prepare("SELECT * FROM reservations WHERE id = ?").get(id);
    if (!reservation) return res.status(404).json({ error: "Prenotazione non trovata" });

    if (reservation.user_id !== req.session.user.id && req.session.user.role !== "admin") {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    if (reservation.status !== "waiting") {
      return res.status(409).json({ error: "Solo prenotazioni in attesa possono essere annullate" });
    }

    db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").run(id);
    res.json({ message: "Prenotazione annullata" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reservations/all  -> all reservations (admin)
router.get("/all", requireAdmin, (req, res) => {
  try {
    const reservations = db.prepare(
      `SELECT r.*, books.title, books.cover_url, books.author, users.name as user_name
       FROM reservations r
       JOIN books ON r.book_id = books.id
       JOIN users ON r.user_id = users.id
       ORDER BY r.created_at DESC`
    ).all();

    const withPosition = reservations.map((r) => {
      if (r.status !== "waiting") return { ...r, position: null };
      const pos = db.prepare(
        `SELECT COUNT(*) as pos FROM reservations
         WHERE book_id = ? AND status = 'waiting' AND created_at <= ?`
      ).get(r.book_id, r.created_at);
      return { ...r, position: pos.pos };
    });

    res.json(withPosition);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
