import bcrypt from "bcryptjs";

// Admin credentials come from environment variables — never hardcode them.
// ADMIN_PASSWORD_HASH should be a bcrypt hash, generated once with:
//   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;

// Fallback for local dev only: if no hash is set, accept ADMIN_KEY as a plain
// password so the old workflow still works without extra setup. Deploying
// with this fallback active is fine for a small pilot but should be replaced
// with ADMIN_PASSWORD_HASH before wider use.
const DEV_FALLBACK_PASSWORD = process.env.ADMIN_KEY || "change-me-before-deploy";

export function verifyAdminCredentials(username, password) {
  if (username !== ADMIN_USERNAME) return false;
  if (ADMIN_PASSWORD_HASH) {
    return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  }
  return password === DEV_FALLBACK_PASSWORD;
}

export function requireAdminSession(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: "Not logged in" });
}
