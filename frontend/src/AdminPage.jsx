import { useEffect, useState } from "react";
import { adminLogin, adminLogout, adminMe, fetchAdminTradies, adminAction } from "./api";

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminMe()
      .then((data) => {
        setIsAdmin(data.isAdmin);
        if (data.isAdmin) load();
      })
      .finally(() => setCheckingSession(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminTradies();
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(null);
    try {
      await adminLogin(username, password);
      setIsAdmin(true);
      setPassword("");
      load();
    } catch (err) {
      setLoginError(err.message);
    }
  }

  async function handleLogout() {
    await adminLogout();
    setIsAdmin(false);
    setRows(null);
  }

  async function handleAction(id, action) {
    try {
      await adminAction(id, action);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (checkingSession) {
    return (
      <div className="admin-page">
        <div className="container">Checking session…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="form-page">
        <div className="container">
          <h1>Admin login</h1>
          <p>Sign in to manage the verification queue.</p>
          {loginError && <div className="status-message error">{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-gold">
              Log in
            </button>
          </form>
        </div>
      </div>
    );
  }

  const overdueCount = rows ? rows.filter((r) => r.overdue).length : 0;

  return (
    <div className="admin-page">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h1>Admin — verification queue</h1>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>

        {overdueCount > 0 && (
          <div className="status-message error">
            {overdueCount} approved profile{overdueCount === 1 ? " is" : "s are"} overdue for
            90-day re-verification — see rows marked <strong>overdue</strong> below.
          </div>
        )}

        {error && <div className="status-message error">{error}</div>}

        {loading && !rows && <p>Loading…</p>}

        {rows && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Trade</th>
                <th>Suburb</th>
                <th>Licence</th>
                <th>Referred by</th>
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
                  <td>{r.referred_by || "—"}</td>
                  <td>
                    <span className={`status-pill ${r.status}`}>{r.status}</span>
                    {r.overdue && (
                      <>
                        <br />
                        <span className="status-pill rejected" style={{ marginTop: 4 }}>
                          overdue
                        </span>
                      </>
                    )}
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
