import { useEffect, useState } from "react";
import { fetchTradies } from "./api";
import Seal from "./Seal";

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function DirectoryPage() {
  const [trade, setTrade] = useState("");
  const [suburb, setSuburb] = useState("");
  const [sort, setSort] = useState("name");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  async function runSearch(e) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const data = await fetchTradies({
        trade,
        suburb,
        sort: sort === "recently_verified" ? "recently_verified" : undefined,
      });
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="hero-eyebrow">Verified · Faith-rooted · South East QLD</p>
          <h1>Find a tradie whose work — and word — you can trust.</h1>
          <p className="lede">
            Every business listed here has had its licence checked against the public
            register before it goes live. No self-reported badges — verified means verified.
          </p>
          <form className="search-bar" onSubmit={runSearch}>
            <input
              placeholder="Trade — e.g. Electrician, Plumber"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
            />
            <input
              placeholder="Suburb — e.g. Capalaba"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="directory-section" style={{ paddingBottom: 32 }}>
        <div className="container">
          <div className="steps" style={{ borderBottom: "none", paddingBottom: 0 }}>
            <div className="step">
              <div className="step-num">01</div>
              <div className="step-label">Tradie submits business & licence details</div>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <div className="step-label">We check the licence against the public register</div>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <div className="step-label">Listing goes live — re-checked every 90 days</div>
            </div>
          </div>
        </div>
      </section>

      <section className="directory-section" style={{ paddingTop: 24 }}>
        <div className="container">
          <div className="directory-header">
            <h2>Listed tradies</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span className="result-count">
                {loading ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}`}
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ border: "var(--border)", padding: "8px 10px", fontFamily: "var(--font-body)" }}
              >
                <option value="name">Sort: Business name</option>
                <option value="recently_verified">Sort: Recently verified</option>
              </select>
            </div>
          </div>

          {!loading && results.length === 0 && (
            <div className="empty-state">
              <strong>No matches yet</strong>
              This directory is growing — try a broader trade or suburb, or check back soon.
            </div>
          )}

          <div className="tradie-grid">
            {results.map((t) => (
              <article className="tradie-card" key={t.id}>
                <div className="tradie-card-top">
                  <div style={{ display: "flex", gap: 12 }}>
                    {t.photo_url ? (
                      <img
                        src={t.photo_url}
                        alt={t.business_name}
                        style={{ width: 44, height: 44, objectFit: "cover", border: "var(--border)" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          background: "var(--stone-deep)",
                          border: "var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          color: "var(--mortar)",
                          flexShrink: 0,
                        }}
                      >
                        {initials(t.business_name)}
                      </div>
                    )}
                    <div>
                      <div className="tradie-trade">{t.trade}</div>
                      <h3>{t.business_name}</h3>
                      <div className="tradie-suburb">{t.suburb}, {t.state}</div>
                    </div>
                  </div>
                  {t.license_verified_at && <Seal verifiedDate={t.license_verified_at} />}
                </div>
                {t.license_verified_at && (
                  <div style={{ fontSize: 13, color: "var(--mortar)" }}>
                    Licence verified {t.license_verified_at}
                  </div>
                )}
                {t.story && <p className="tradie-story">{t.story}</p>}
                <div className="tradie-contact">
                  {t.contact_name} · {t.phone || t.email}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
