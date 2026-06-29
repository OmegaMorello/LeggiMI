import nodemailer from "nodemailer";

let transporter = null;

export async function getTransporter() {
  if (transporter) return transporter;

  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtp) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("[mail] Using Ethereal test account:", testAccount.user);
  }

  return transporter;
}

export async function sendReminderEmail({ to, userName, bookTitle, dueDate, isOverdue }) {
  const transport = await getTransporter();
  const from = process.env.MAIL_FROM || "Biblioteca <noreply@biblioteca.local>";

  const subject = isOverdue
    ? `Prestito scaduto: "${bookTitle}"`
    : `Promemoria scadenza: "${bookTitle}"`;

  const text = isOverdue
    ? `Ciao ${userName},\n\nil prestito del libro "${bookTitle}" è scaduto il ${dueDate}.\nTi preghiamo di restituirlo al più presto.\n\nBiblioteca LeggiMI`
    : `Ciao ${userName},\n\nil prestito del libro "${bookTitle}" scade il ${dueDate}.\nRicordati di restituirlo entro la scadenza.\n\nBiblioteca LeggiMI`;

  const info = await transport.sendMail({ from, to, subject, text });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("[mail] Preview:", previewUrl);
  }

  return { info, previewUrl: previewUrl || null };
}
