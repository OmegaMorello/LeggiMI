import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { db } from "../db/db.js";

const router = Router();

router.get("/most-requested", requireAdmin, (req, res) => {
  try {
    const limitParam = parseInt(req.query.limit, 10);
    const hasLimit = !isNaN(limitParam) && limitParam > 0;

    const sql = `
      SELECT
        b.id, b.title, b.author, b.cover_url,
        COUNT(l.id) AS loan_count,
        (SELECT COUNT(*) FROM reservations WHERE book_id = b.id) AS reservation_count
      FROM books b
      JOIN copies c ON c.book_id = b.id
      JOIN loans l ON l.copy_id = c.id
      GROUP BY b.id
      ORDER BY loan_count DESC
      ${hasLimit ? "LIMIT ?" : ""}
    `;

    const rows = hasLimit
      ? db.prepare(sql).all(limitParam)
      : db.prepare(sql).all();

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
