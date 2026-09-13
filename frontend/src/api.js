// In local dev, Vite proxies /api to localhost:4000 (see vite.config.js).
// In production, set VITE_API_BASE_URL to your deployed backend's URL, e.g.
// https://cornerstone-trades-backend.up.railway.app/api
const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function fetchTradies({ trade, suburb, sort } = {}) {
  const params = new URLSearchParams();
  if (trade) params.set("trade", trade);
  if (suburb) params.set("suburb", suburb);
  if (sort) params.set("sort", sort);
  const res = await fetch(`${BASE}/tradies?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load directory");
  return res.json();
}

export async function submitTradie(payload) {
  const res = await fetch(`${BASE}/tradies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Submission failed");
  return data;
}

export async function adminLogin(username, password) {
  const res = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function adminLogout() {
  await fetch(`${BASE}/admin/logout`, { method: "POST", credentials: "include" });
}

export async function adminMe() {
  const res = await fetch(`${BASE}/admin/me`, { credentials: "include" });
  return res.json();
}

export async function fetchAdminTradies(status) {
  const params = status ? `?status=${status}` : "";
  const res = await fetch(`${BASE}/admin/tradies${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Unauthorized or request failed");
  return res.json();
}

export async function adminAction(id, action) {
  const res = await fetch(`${BASE}/admin/tradies/${id}/${action}`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Action failed");
  return res.json();
}
