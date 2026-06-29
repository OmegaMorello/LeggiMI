import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { runReminderJob } from "../mail/reminderJob.js";

const router = Router();

// POST /api/reminders/send  -> manually trigger the reminder job (admin)
router.post("/send", requireAdmin, async (req, res) => {
  try {
    const result = await runReminderJob();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
