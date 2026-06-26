// ============================================================
//  loanRoutes.js  —  /api/loans
//  Request a loan, return a copy, list my loans / all loans.
// ============================================================

import { Router } from "express";
// import { requireAuth, requireAdmin } from "../middleware/auth.js";
// import { db } from "../db/db.js";

const router = Router();

// GET /api/loans/mine  -> the current user's loans (active + history) (L1/L2)
// TODO: requireAuth; select loans for req.session.user.id.
router.get("/mine", (req, res) => {
  res.status(501).json({ error: "TODO: my loans" });
});

// POST /api/loans  -> request a loan of an available copy of a book (L1)
//   body: { bookId }
// TODO: find an available copy; set due_date (start + period);
//       mark copy 'on_loan'; create loan 'active'.
router.post("/", (req, res) => {
  res.status(501).json({ error: "TODO: request loan" });
});

// POST /api/loans/:id/return  -> return a loaned copy (L1/L2)
// TODO: set return_date, status 'returned', copy back to 'available';
//       then promote the first reservation in the queue (L2).
router.post("/:id/return", (req, res) => {
  res.status(501).json({ error: "TODO: return loan" });
});

// GET /api/loans  -> all loans (admin) (L1)
// TODO: requireAdmin; list every loan with user + book info.
router.get("/", (req, res) => {
  res.status(501).json({ error: "TODO: all loans (admin)" });
});

export default router;
