// In local dev, Vite proxies /api to localhost:4000 (see vite.config.js).
// In production, set VITE_API_BASE_URL to your deployed backend's URL, e.g.
// https://cornerstone-trades-backend.up.railway.app/api
const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function fetchTradies({ trade, suburb } = {}) {
  const params = new URLSearchParams();
  if (trade) params.set("trade", trade);
  if (suburb) params.set("suburb", suburb);
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

export async function fetchAdminTradies(adminKey, status) {
  const params = status ? `?status=${status}` : "";
  const res = await fetch(`${BASE}/admin/tradies${params}`, {
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error("Unauthorized or request failed");
  return res.json();
}

export async function adminAction(adminKey, id, action) {
  const res = await fetch(`${BASE}/admin/tradies/${id}/${action}`, {
    method: "POST",
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error("Action failed");
  return res.json();
}
