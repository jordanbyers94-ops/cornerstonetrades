# Cornerstone Trades — MVP

A verified directory of Christian tradespeople in South East QLD. Customers search by
trade and suburb; every listed business has had its licence manually checked against
the public register before going live — no self-reported badges.

## What's in v1.1

- Public searchable directory (trade + suburb), sortable by name or most
  recently verified
- Visible "licence verified [date]" on every card, plus a public verification
  history log per profile (not just an internal badge)
- Tradie sign-up form → creates a **pending** profile, with optional photo
  URL and a "referred by" field for tracking organic growth
- Real admin login (username + bcrypt-hashed password, session cookie) —
  replaces the earlier shared-key approach
- Admin queue flags **overdue** profiles whose 90-day re-verification has lapsed
- Sign-up form is rate-limited (10/hour) against spam
- Optional email notification on new sign-up — no-ops safely until you add
  SMTP credentials (see Environment variables below)

**Cut from v1 on purpose:** community features, jobs board, payments, in-app
messaging, public reviews. Add these once directory demand is proven.

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

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `SESSION_SECRET` | Before deploying | Signs the admin session cookie — set to a long random string |
| `ADMIN_USERNAME` | Optional | Defaults to `admin` |
| `ADMIN_PASSWORD_HASH` | Before deploying | bcrypt hash of your admin password — generate with `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"` |
| `ADMIN_KEY` | Dev only | If `ADMIN_PASSWORD_HASH` isn't set, this is used as a plain-text fallback password for local dev — don't rely on this in production |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL` | Optional | If all are set, a new sign-up sends you an email. If unset, it's just logged to the console |
| `FRONTEND_ORIGIN` | Before deploying | Your deployed frontend's URL, for CORS + cookies to work cross-origin |
| `DB_PATH` | Recommended for deploy | Where the SQLite file lives — point this at a mounted volume so data survives redeploys |

For local dev, the defaults work with no setup — the admin login accepts
`admin` / `change-me-before-deploy` until you set real credentials.

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

- Set `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` to real values (not the dev fallbacks)
- Decide where SQLite data lives long-term (volume vs. Postgres migration)
- Add SMTP credentials if you want real sign-up email notifications
- Confirm domain name and trademark search results before committing to a
  final brand name
- Manually verify each pilot tradie's licence against the relevant QLD
  register (QBCC, Energy Safety QLD, etc.) before approving
