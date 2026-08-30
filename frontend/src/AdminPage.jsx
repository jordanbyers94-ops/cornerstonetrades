import { useState } from "react";
import { fetchAdminTradies, adminAction } from "./api";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminTradies(adminKey);
      setRows(data);
    } catch (err) {
      setError(err.message);
      setRows(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id, action) {
    try {
      await adminAction(adminKey, id, action);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="container">
        <h1>Admin — verification queue</h1>
        <p style={{ color: "var(--mortar)", marginTop: 0 }}>
          This is a lightweight MVP admin screen — protected only by the key below, not a
          real login. Fine for a small pilot; add proper auth before wider launch.
        </p>

        <div className="admin-key-bar">
          <input
            type="password"
            placeholder="Admin key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
          />
          <button className="btn btn-primary" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Load queue"}
          </button>
        </div>

        {error && <div className="status-message error">{error}</div>}

        {rows && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Trade</th>
                <th>Suburb</th>
                <th>Licence</th>
                <th>Status</th>
                <th>Next re-verify</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.business_name}</strong>
                    <br />
                    <span style={{ color: "var(--mortar)" }}>{r.contact_name}</span>
                  </td>
                  <td>{r.trade}</td>
                  <td>{r.suburb}, {r.state}</td>
                  <td>
                    {r.license_number || "—"}
                    <br />
                    <span style={{ color: "var(--mortar)" }}>{r.licensing_body}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${r.status}`}>{r.status}</span>
                  </td>
                  <td>{r.next_reverification_due || "—"}</td>
                  <td>
                    <div className="row-actions">
                      {r.status !== "approved" && (
                        <button onClick={() => handleAction(r.id, "approve")}>Approve</button>
                      )}
                      {r.status !== "rejected" && (
                        <button onClick={() => handleAction(r.id, "reject")}>Reject</button>
                      )}
                      {r.status === "approved" && (
                        <button onClick={() => handleAction(r.id, "reverify")}>Re-verify</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
