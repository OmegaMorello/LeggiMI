// ============================================================
//  authRoutes.js  —  /api/auth
//  Registration, login, logout and "who am I" using sessions.
//  Handlers are stubs: we fill them in step by step.
// ============================================================

import { Router } from "express";
// import bcrypt from "bcrypt";
// import { db } from "../db/db.js";

const router = Router();

// POST /api/auth/register  -> create a user (Level 1)
// TODO: validate body, hash password with bcrypt, insert into users.
router.post("/register", (req, res) => {
  res.status(501).json({ error: "TODO: register" });
});

// POST /api/auth/login  -> verify credentials, start a session (Level 1)
// TODO: look up user by email, compare bcrypt hash, set req.session.user.
router.post("/login", (req, res) => {
  res.status(501).json({ error: "TODO: login" });
});

// POST /api/auth/logout  -> destroy the session
// TODO: req.session.destroy(...) and clear the cookie.
router.post("/logout", (req, res) => {
  res.status(501).json({ error: "TODO: logout" });
});

// GET /api/auth/me  -> return the current user (or null)
// TODO: respond with req.session.user || null.
router.get("/me", (req, res) => {
  res.json(req.session.user || null);
});

export default router;
