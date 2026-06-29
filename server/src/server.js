// ============================================================
//  server.js  —  Express app entry point
//  Sets up middleware, server-side sessions and mounts routers.
//  Start:  npm install  ->  npm run dev   (http://localhost:3000)
// ============================================================

import "dotenv/config"; // loads variables from .env (if present)
import express from "express";
import session from "express-session";
import cron from "node-cron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { db } from "./db/db.js"; // opens the DB and runs the schema
import { runReminderJob } from "./mail/reminderJob.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Routers (one file per resource). Logic is added step by step.
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// --- Core middleware ----------------------------------------
app.use(express.json()); // parse JSON request bodies

// Server-side sessions: a signed cookie holds the session id,
// the session data (req.session.user) is kept on the server.
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "i-am-almost-a-computer-science-engineer",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // not readable by JS in the browser
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
);

// --- Static files (uploaded covers) --------------------------
app.use("/uploads", express.static(join(__dirname, "../uploads")));

// --- API routes ---------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/reminders", reminderRoutes);

// Simple health check (useful to verify the server is up).
app.get("/api/health", (req, res) => res.json({ ok: true }));

// --- Scheduled jobs -----------------------------------------
cron.schedule("0 8 * * *", () => {
  console.log("[cron] Running daily reminder job…");
  runReminderJob().catch((err) =>
    console.error("[cron] Reminder job failed:", err),
  );
});

// --- Start --------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
