export default function Seal({ verifiedDate }) {
  return (
    <div className="seal" title={verifiedDate ? `License verified ${verifiedDate}` : "Verified"}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" stroke="var(--gold)" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="14" stroke="var(--gold)" strokeWidth="1" strokeDasharray="2 2" />
        <path
          d="M13 20.5L17.5 25L27 14.5"
          stroke="var(--gold-deep)"
          strokeWidth="2.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
      <span className="seal-label">
        Licence
        <br />
        verified
      </span>
    </div>
  );
}
