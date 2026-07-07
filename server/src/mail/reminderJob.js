import { db } from "../db/db.js";
import { sendReminderEmail } from "./mailer.js";

export async function runReminderJob({ force = false } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threshold = threeDaysLater.toISOString().slice(0, 10);

  // Mark overdue loans in a transaction
  db.transaction(() => {
    db.prepare(
      "UPDATE loans SET status = 'overdue' WHERE status = 'active' AND due_date < ?"
    ).run(today);
  })();

  // Fetch loans needing a reminder: due within 3 days OR already overdue
  const loans = db.prepare(`
    SELECT l.id, l.due_date, l.status,
           u.name AS user_name, u.email AS user_email,
           b.title AS book_title
    FROM loans l
    JOIN users u ON l.user_id = u.id
    JOIN copies c ON l.copy_id = c.id
    JOIN books b ON c.book_id = b.id
    WHERE l.status IN ('active', 'overdue')
      AND l.due_date <= ?
      ${force ? "" : "AND (l.reminder_sent_at IS NULL OR date(l.reminder_sent_at) != date('now'))"}
  `).all(threshold);

  if (loans.length === 0) {
    console.log("[reminder] No loans needing reminders.");
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const previewUrls = [];
  const now = new Date().toISOString();

  for (const loan of loans) {
    try {
      const { previewUrl } = await sendReminderEmail({
        to: loan.user_email,
        userName: loan.user_name,
        bookTitle: loan.book_title,
        dueDate: loan.due_date,
        isOverdue: loan.status === "overdue",
      });
      db.prepare("UPDATE loans SET reminder_sent_at = ? WHERE id = ?").run(now, loan.id);
      sent++;
      if (previewUrl) previewUrls.push(previewUrl);
    } catch (err) {
      console.error(`[reminder] Failed for loan ${loan.id}:`, err.message);
      failed++;
    }
  }

  console.log(`[reminder] Done: ${sent} sent, ${failed} failed.`);
  return { sent, failed, previewUrls };
}
