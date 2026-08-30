import express from "express";
import cors from "cors";
import morgan from "morgan";
import { nanoid } from "nanoid";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_KEY = process.env.ADMIN_KEY || "change-me-before-deploy";

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

function requireAdmin(req, res, next) {
  const key = req.header("x-admin-key");
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// ---------- Public routes ----------

// Search the public directory. Only approved + opted-in profiles are visible.
app.get("/api/tradies", (req, res) => {
  const { trade, suburb } = req.query;
  let query = `SELECT id, trade, business_name, contact_name, suburb, state, phone, email, story, license_verified_at
               FROM tradies WHERE status = 'approved' AND public_directory = 1`;
  const params = [];

  if (trade) {
    query += " AND trade LIKE ?";
    params.push(`%${trade}%`);
  }
  if (suburb) {
    query += " AND suburb LIKE ?";
    params.push(`%${suburb}%`);
  }
  query += " ORDER BY business_name ASC";

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.get("/api/tradies/:id", (req, res) => {
  const row = db
    .prepare(
      `SELECT id, trade, business_name, contact_name, suburb, state, phone, email, story, license_verified_at
       FROM tradies WHERE id = ? AND status = 'approved' AND public_directory = 1`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

// Sign-up: creates a pending profile awaiting manual verification.
app.post("/api/tradies", (req, res) => {
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
      (id, trade, business_name, contact_name, suburb, state, phone, email, license_number, licensing_body, story, public_directory, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
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
    public_directory ? 1 : 0
  );

  res.status(201).json({ id, status: "pending" });
});

// ---------- Admin routes (protected by x-admin-key header) ----------

app.get("/api/admin/tradies", requireAdmin, (req, res) => {
  const { status } = req.query;
  let query = "SELECT * FROM tradies";
  const params = [];
  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY created_at DESC";
  res.json(db.prepare(query).all(...params));
});

app.post("/api/admin/tradies/:id/approve", requireAdmin, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const nextDue = addMonths(today, 3); // 90-day re-verification cadence
  const result = db
    .prepare(
      `UPDATE tradies SET status = 'approved', license_verified_at = ?, next_reverification_due = ?
       WHERE id = ?`
    )
    .run(today, nextDue, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true, license_verified_at: today, next_reverification_due: nextDue });
});

app.post("/api/admin/tradies/:id/reject", requireAdmin, (req, res) => {
  const result = db
    .prepare(`UPDATE tradies SET status = 'rejected' WHERE id = ?`)
    .run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.post("/api/admin/tradies/:id/reverify", requireAdmin, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const nextDue = addMonths(today, 3);
  const result = db
    .prepare(
      `UPDATE tradies SET license_verified_at = ?, next_reverification_due = ? WHERE id = ?`
    )
    .run(today, nextDue, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true, license_verified_at: today, next_reverification_due: nextDue });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Cornerstone Trades API running on port ${PORT}`);
});
