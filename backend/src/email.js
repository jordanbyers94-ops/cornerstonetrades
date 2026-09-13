import nodemailer from "nodemailer";

// Email is entirely optional. If SMTP_HOST/SMTP_USER/SMTP_PASS/NOTIFY_EMAIL
// aren't set, notifications are just logged to the console instead of sent —
// so the app works out of the box and you can wire up real email whenever
// you have SMTP credentials (e.g. from your domain host, or a service like
// Resend/Postmark/SendGrid's SMTP endpoint).
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL } = process.env;

const emailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && NOTIFY_EMAIL);

let transporter = null;
if (emailConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function notifyNewSignup(tradie) {
  const subject = `New Cornerstone Trades sign-up: ${tradie.business_name}`;
  const body = `${tradie.business_name} (${tradie.trade}, ${tradie.suburb}) just signed up and is waiting for licence verification.

Contact: ${tradie.contact_name} — ${tradie.email} ${tradie.phone || ""}
Licence: ${tradie.license_number || "not provided"} (${tradie.licensing_body || "not provided"})

Review it in the admin queue.`;

  if (!emailConfigured) {
    console.log("[email notification skipped — SMTP not configured]\n" + subject + "\n" + body);
    return;
  }

  try {
    await transporter.sendMail({
      from: SMTP_USER,
      to: NOTIFY_EMAIL,
      subject,
      text: body,
    });
  } catch (err) {
    // Never let a notification failure break the sign-up flow itself.
    console.error("Failed to send sign-up notification email:", err.message);
  }
}
