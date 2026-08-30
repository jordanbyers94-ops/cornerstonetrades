# Cornerstone Trades — MVP

A verified directory of Christian tradespeople in South East QLD. Customers search by
trade and suburb; every listed business has had its licence manually checked against
the public register before going live — no self-reported badges.

## What's in v1 (deliberately minimal)

- Public searchable directory (trade + suburb)
- Tradie sign-up form → creates a **pending** profile
- Lightweight admin screen to approve/reject/re-verify profiles (protected by a
  shared admin key — fine for a small pilot, not a real login system)
- 90-day re-verification cadence built into the data model

**Cut from v1 on purpose:** community features, jobs board, payments, in-app
messaging, public reviews. Add these once directory demand is proven — see the
"What's next" section in the project notes.

## Stack

- **Backend:** Node.js, Express, SQLite (`better-sqlite3`) — same pattern as
  Core Covenant's Express/Railway setup, swapped to SQLite for a zero-config MVP.
  Easy to move to Postgres later if you want parity with Core Covenant's DB.
- **Frontend:** React + Vite, plain CSS (no framework) using a quarry-stone
  design system — see `frontend/src/styles.css` for the token set.

## Local setup

### Backend

```bash
cd backend
npm install
npm run seed     # optional — adds two sample tradie profiles
npm run dev       # runs on http://localhost:4000
```

Set an admin key before you rely on the admin screen for anything real:

```bash
ADMIN_KEY=some-long-random-string npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # runs on http://localhost:5173, proxies /api to :4000
```

Visit `http://localhost:5173`. The admin screen is at `/admin` — enter the
`ADMIN_KEY` you set above to load the verification queue.

## Deploying (Railway + Cloudflare DNS — same pattern as Core Covenant)

1. **Backend on Railway:** create a new Railway project, deploy the `backend/`
   folder. Set the `ADMIN_KEY` environment variable to a strong random value.
   SQLite works fine at this scale, but Railway's filesystem isn't guaranteed
   persistent across redeploys — for anything beyond a pilot, either mount a
   Railway volume for `data.sqlite` or migrate to Railway's Postgres add-on.
2. **Frontend on Railway (or Cloudflare Pages):** deploy `frontend/`, set the
   build command to `npm run build` and serve `dist/`. Point its API calls at
   the backend's Railway URL (update `vite.config.js` proxy or set an
   environment-based API base URL for production).
3. **Domain via Cloudflare:** once you've registered your `.com.au` domain,
   add it to Cloudflare and point the DNS records at your Railway deployment,
   the same way corecovenant.com.au was connected.

## Data model

Single `tradies` table — see `backend/src/db.js`. Key fields:

- `status`: `pending` → `approved` (or `rejected`) — controls admin queue
- `public_directory`: whether the tradie opted into public search results
- `license_verified_at` / `next_reverification_due`: re-verification cadence,
  set to +3 months on every approve/re-verify action

## Before a real pilot launch

- Replace the shared admin key with real authentication
- Decide where SQLite data lives long-term (volume vs. Postgres migration)
- Confirm domain name and trademark search results before committing to a
  final brand name
- Manually verify each pilot tradie's licence against the relevant QLD
  register (QBCC, Energy Safety QLD, etc.) before approving
