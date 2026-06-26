// ============================================================
//  statsRoutes.js  —  /api/stats   (Level 3)
//  Simple analytics built from data we already have.
// ============================================================

import { Router } from "express";
// import { db } from "../db/db.js";

const router = Router();

// GET /api/stats/most-requested  -> ranking of most borrowed books (L3)
// TODO: count loans (and/or reservations) grouped by book, order desc.
router.get("/most-requested", (req, res) => {
  res.status(501).json({ error: "TODO: most requested books" });
});

export default router;
