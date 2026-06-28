// ============================================================
//  loanRoutes.js  —  /api/loans
//  Request a loan, return a copy, list my loans / all loans.
// ============================================================

import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { db } from "../db/db.js";

const router = Router();

// GET /api/loans/mine  -> the current user's loans (active + history) (L1/L2)
router.get("/mine", requireAuth, (req, res) => {
  const userId = req.session.user.id;
  try {
    const loans = db
      .prepare(
        `SELECT loans.*, copies.book_id, books.title, books.cover_url
         FROM loans
         JOIN copies ON loans.copy_id = copies.id
         JOIN books ON copies.book_id = books.id
         WHERE loans.user_id = ?`,
      )
      .all(userId);
    res.status(200).json(loans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/loans  -> request a loan of an available copy of a book (L1)
router.post("/", requireAuth, (req, res) => {
  const bookId = req.body.bookId || null;

  if (!bookId) {
    return res.status(400).json({ error: "Missing bookId" });
  }
  if (typeof bookId !== "number") {
    return res.status(400).json({ error: "Invalid bookId" });
  }

  try {
    const copy = db
      .prepare(
        "SELECT * FROM copies WHERE book_id = ? AND status = 'available' LIMIT 1",
      )
      .get(bookId);

    if (!copy) {
      return res.status(404).json({ error: "No available copies" });
    }

    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    let loanId;
    db.transaction(() => {
      db.prepare("UPDATE copies SET status = 'on_loan' WHERE id = ?").run(
        copy.id,
      );
      const result = db
        .prepare(
          "INSERT INTO loans (user_id, copy_id, start_date, due_date, status) VALUES (?, ?, ?, ?, 'active')",
        )
        .run(req.session.user.id, copy.id, startDate, dueDateStr);
      loanId = result.lastInsertRowid;
    })();

    const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(loanId);
    res.status(201).json(loan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/loans/:id/return  -> return a loaned copy (L1)
// TODO: promote the first reservation in the queue (L2).
router.post("/:id/return", requireAuth, (req, res) => {
  const loanId = parseInt(req.params.id, 10);
  if (isNaN(loanId)) {
    return res.status(400).json({ error: "Invalid loan ID" });
  }

  try {
    const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(loanId);
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    if (
      loan.user_id !== req.session.user.id &&
      req.session.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    db.transaction(() => {
      db.prepare(
        "UPDATE loans SET return_date = ?, status = 'returned' WHERE id = ?",
      ).run(new Date().toISOString().slice(0, 10), loanId);
      db.prepare("UPDATE copies SET status = 'available' WHERE id = ?").run(
        loan.copy_id,
      );
    })();

    res.status(200).json({ message: "Loan returned successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/loans  -> all loans (admin) (L1)
router.get("/all", requireAdmin, (req, res) => {
  try {
    const loans = db
      .prepare(
        `SELECT loans.*, copies.book_id, books.title, users.name as user_name
         FROM loans
         JOIN copies ON loans.copy_id = copies.id
         JOIN books ON copies.book_id = books.id
         JOIN users ON loans.user_id = users.id`,
      )
      .all();
    res.status(200).json(loans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
