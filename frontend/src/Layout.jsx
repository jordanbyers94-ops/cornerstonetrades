import { Link, NavLink } from "react-router-dom";

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="9" width="26" height="18" fill="var(--stone-deep)" stroke="var(--ink)" strokeWidth="1.4" />
      <path d="M1 9L14 1L27 9" fill="var(--ink)" />
      <rect x="6" y="15" width="7" height="12" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
      <rect x="16" y="15" width="6" height="6" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
    </svg>
  );
}

export default function Layout({ children }) {
  return (
    <div>
      <header className="site-header">
        <div className="container">
          <Link to="/" className="logo">
            <LogoMark />
            Cornerstone Trades
          </Link>
          <nav className="main-nav">
            <NavLink to="/" end>
              Find a tradie
            </NavLink>
            <NavLink to="/list-your-business">List your business</NavLink>
            <Link to="/list-your-business" className="btn btn-gold">
              Get listed
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container">
          <span>© {new Date().getFullYear()} Cornerstone Trades — Brisbane &amp; South East QLD</span>
          <Link to="/admin">Admin</Link>
        </div>
      </footer>
    </div>
  );
}
