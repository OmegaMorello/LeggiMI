// ============================================================
//  authRoutes.js  —  /api/auth
//  Registration, login, logout and "who am I" using sessions.
//  Handlers are stubs: we fill them in step by step.
// ============================================================

import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "../db/db.js";

const router = Router();

// POST /api/auth/register  -> create a user (Level 1)
router.post("/register", async (req, res) => {
  const name = (req.body.name || "").trim();
  // Normalize the email so "Mario@X.com " and "mario@x.com" are the
  // same account (and the UNIQUE check can't be bypassed by casing).
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";

  if (!name || !email || !password)
    return res.status(400).json({ error: "Missing fields" });
  if (password.length < 8)
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });

  const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (exists)
    return res.status(409).json({ error: "Email already registered" });

  const hash = await bcrypt.hash(password, 10);
  try {
    db.prepare(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    ).run(name, email, hash);
  } catch (err) {
    // Safety net for the race between the check above and the insert:
    // the UNIQUE constraint is the real guarantee.
    if (String(err.message).includes("UNIQUE"))
      return res.status(409).json({ error: "Email already registered" });
    throw err;
  }

  res.status(201).json({ message: "User created" });
});

// POST /api/auth/login  -> verify credentials, start a session (Level 1)
router.post("/login", async (req, res) => {
  // Same normalization as register, so login matches the stored email.
  const email = (req.body.email || "").trim().toLowerCase();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  const ok =
    user && (await bcrypt.compare(req.body.password || "", user.password_hash));

  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "Login failed" });

    req.session.user = { id: user.id, name: user.name, role: user.role };
    res.json(req.session.user);
  });
});

// POST /api/auth/logout  -> destroy the session
router.post("/logout", async (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/me  -> return the current user (or null)
router.get("/me", (req, res) => {
  res.json(req.session.user || null);
});

export default router;
