import express from "express";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import rateLimit from "express-rate-limit";
import { nanoid } from "nanoid";
import { db } from "./db.js";
import { verifyAdminCredentials, requireAdminSession } from "./auth.js";
import { notifyNewSignup } from "./email.js";

const app = express();
const PORT = process.env.PORT || 4000;
const IS_PROD = process.env.NODE_ENV === "production";

app.set("trust proxy", 1); // needed for secure cookies behind Railway's proxy

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use(
  session({
    name: "cornerstone.sid",
    secret: process.env.SESSION_SECRET || "dev-only-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// Public sign-up is rate-limited so the form can't be spammed with fake profiles.
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sign-ups from this address — please try again later." },
});

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function isOverdue(nextDue) {
  if (!nextDue) return false;
  return new Date(nextDue) < new Date();
}

const PUBLIC_FIELDS = `id, trade, business_name, contact_name, suburb, state, phone, email,
  story, photo_url, license_verified_at, next_reverification_due`;

// ---------- Public routes ----------

app.get("/api/tradies", (req, res) => {
  const { trade, suburb, sort } = req.query;
  let query = `SELECT ${PUBLIC_FIELDS} FROM tradies WHERE status = 'approved' AND public_directory = 1`;
  const params = [];

  if (trade) {
    query += " AND trade LIKE ?";
    params.push(`%${trade}%`);
  }
  if (suburb) {
    query += " AND suburb LIKE ?";
    params.push(`%${suburb}%`);
  }

  if (sort === "recently_verified") {
    query += " ORDER BY license_verified_at DESC";
  } else {
    query += " ORDER BY business_name ASC";
  }

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.get("/api/tradies/:id", (req, res) => {
  const row = db
    .prepare(`SELECT ${PUBLIC_FIELDS} FROM tradies WHERE id = ? AND status = 'approved' AND public_directory = 1`)
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });

  const log = db
    .prepare("SELECT verified_at, note FROM verification_log WHERE tradie_id = ? ORDER BY verified_at DESC")
    .all(req.params.id);

  res.json({ ...row, verification_log: log });
});

app.post("/api/tradies", signupLimiter, async (req, res) => {
  const {
    trade,
    business_name,
    contact_name,
    suburb,
    state,
    phone,
    email,
    license_number,
    licensing_body,
    story,
    photo_url,
    referred_by,
    public_directory,
  } = req.body || {};

  if (!trade || !business_name || !contact_name || !suburb || !email) {
    return res.status(400).json({
      error: "trade, business_name, contact_name, suburb and email are required",
    });
  }

  const id = nanoid(10);
  db.prepare(
    `INSERT INTO tradies
      (id, trade, business_name, contact_name, suburb, state, phone, email, license_number, licensing_body, story, photo_url, referred_by, public_directory, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
  ).run(
    id,
    trade,
    business_name,
    contact_name,
    suburb,
    state || "QLD",
    phone || null,
    email,
    license_number || null,
    licensing_body || null,
    story || null,
    photo_url || null,
    referred_by || null,
    public_directory ? 1 : 0
  );

  await notifyNewSignup({ id, trade, business_name, contact_name, suburb, email, phone, license_number, licensing_body });

  res.status(201).json({ id, status: "pending" });
});

// ---------- Admin auth ----------

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!verifyAdminCredentials(username, password)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  req.session.isAdmin = true;
  req.session.username = username;
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/me", (req, res) => {
  res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
});

// ---------- Admin routes (require a logged-in session) ----------

app.get("/api/admin/tradies", requireAdminSession, (req, res) => {
  const { status } = req.query;
  let query = "SELECT * FROM tradies";
  const params = [];
  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY created_at DESC";
  const rows = db.prepare(query).all(...params).map((r) => ({
    ...r,
    overdue: r.status === "approved" && isOverdue(r.next_reverification_due),
  }));
  res.json(rows);
});

app.post("/api/admin/tradies/:id/approve", requireAdminSession, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const nextDue = addMonths(today, 3); // 90-day re-verification cadence
  const result = db
    .prepare(
      `UPDATE tradies SET status = 'approved', license_verified_at = ?, next_reverification_due = ?
       WHERE id = ?`
    )
    .run(today, nextDue, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });

  db.prepare("INSERT INTO verification_log (tradie_id, verified_at, note) VALUES (?, ?, ?)").run(
    req.params.id,
    today,
    "Initial approval"
  );

  res.json({ ok: true, license_verified_at: today, next_reverification_due: nextDue });
});

app.post("/api/admin/tradies/:id/reject", requireAdminSession, (req, res) => {
  const result = db.prepare(`UPDATE tradies SET status = 'rejected' WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.post("/api/admin/tradies/:id/reverify", requireAdminSession, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const nextDue = addMonths(today, 3);
  const result = db
    .prepare(`UPDATE tradies SET license_verified_at = ?, next_reverification_due = ? WHERE id = ?`)
    .run(today, nextDue, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });

  db.prepare("INSERT INTO verification_log (tradie_id, verified_at, note) VALUES (?, ?, ?)").run(
    req.params.id,
    today,
    "Re-verification"
  );

  res.json({ ok: true, license_verified_at: today, next_reverification_due: nextDue });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Cornerstone Trades API running on port ${PORT}`);
});
