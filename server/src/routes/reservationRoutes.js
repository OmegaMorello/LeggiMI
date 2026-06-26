// ============================================================
//  reservationRoutes.js  —  /api/reservations
//  Reserve a book when no copy is available; manage the queue (L2).
// ============================================================

import { Router } from "express";
// import { requireAuth } from "../middleware/auth.js";
// import { db } from "../db/db.js";

const router = Router();

// GET /api/reservations/mine  -> the current user's reservations (L2)
router.get("/mine", (req, res) => {
  res.status(501).json({ error: "TODO: my reservations" });
});

// POST /api/reservations  -> reserve a book with no available copies (L2)
//   body: { bookId }
// TODO: requireAuth; only allow if all copies are on loan;
//       prevent duplicate reservation; create reservation 'waiting'.
router.post("/", (req, res) => {
  res.status(501).json({ error: "TODO: create reservation" });
});

// DELETE /api/reservations/:id  -> cancel a reservation (L2)
router.delete("/:id", (req, res) => {
  res.status(501).json({ error: "TODO: cancel reservation" });
});

export default router;
