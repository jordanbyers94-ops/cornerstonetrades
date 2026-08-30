import { nanoid } from "nanoid";
import { db } from "./db.js";

const sample = [
  {
    trade: "Electrician",
    business_name: "Steadfast Electrical",
    contact_name: "Jordan B.",
    suburb: "Capalaba",
    state: "QLD",
    phone: "0400 000 000",
    email: "jordan@example.com",
    license_number: "12345",
    licensing_body: "Energy Safety QLD",
    story: "Third-generation electrician, active in the local church community.",
    public_directory: 1,
    status: "approved",
  },
  {
    trade: "Plumber",
    business_name: "Faithful Flow Plumbing",
    contact_name: "Sam T.",
    suburb: "Cleveland",
    state: "QLD",
    phone: "0400 111 111",
    email: "sam@example.com",
    license_number: "67890",
    licensing_body: "QBCC",
    story: "Family-run business, 12 years serving the bayside.",
    public_directory: 1,
    status: "pending",
  },
];

const insert = db.prepare(`
  INSERT INTO tradies
    (id, trade, business_name, contact_name, suburb, state, phone, email, license_number, licensing_body, story, public_directory, status, license_verified_at, next_reverification_due)
  VALUES (@id, @trade, @business_name, @contact_name, @suburb, @state, @phone, @email, @license_number, @licensing_body, @story, @public_directory, @status, @license_verified_at, @next_reverification_due)
`);

for (const t of sample) {
  const isApproved = t.status === "approved";
  insert.run({
    id: nanoid(10),
    ...t,
    license_verified_at: isApproved ? new Date().toISOString().slice(0, 10) : null,
    next_reverification_due: isApproved
      ? new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10)
      : null,
  });
}

console.log(`Seeded ${sample.length} tradie profiles.`);
