import { useEffect, useState } from "react";
import { fetchTradies } from "./api";
import Seal from "./Seal";

export default function DirectoryPage() {
  const [trade, setTrade] = useState("");
  const [suburb, setSuburb] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  async function runSearch(e) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const data = await fetchTradies({ trade, suburb });
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <section className="directory-section">
        <div className="container">
          <div className="directory-header">
            <h2>Listed tradies</h2>
            <span className="result-count">
              {loading ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}`}
            </span>
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
                  <div>
                    <div className="tradie-trade">{t.trade}</div>
                    <h3>{t.business_name}</h3>
                    <div className="tradie-suburb">{t.suburb}, {t.state}</div>
                  </div>
                  {t.license_verified_at && <Seal verifiedDate={t.license_verified_at} />}
                </div>
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
