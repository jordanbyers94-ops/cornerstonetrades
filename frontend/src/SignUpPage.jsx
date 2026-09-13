import { useState } from "react";
import { submitTradie } from "./api";

const initialForm = {
  trade: "",
  business_name: "",
  contact_name: "",
  suburb: "",
  state: "QLD",
  phone: "",
  email: "",
  license_number: "",
  licensing_body: "",
  story: "",
  photo_url: "",
  referred_by: "",
  public_directory: true,
};

export default function SignUpPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null); // { type, message }
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      await submitTradie(form);
      setStatus({
        type: "success",
        message:
          "Thanks — your profile is in the queue. We manually check every licence before a listing goes live, so it may take a couple of days before you appear in the directory.",
      });
      setForm(initialForm);
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-page">
      <div className="container">
        <h1>List your business</h1>
        <p>
          Three steps: tell us about your business, we verify your licence against the
          public register, and you go live in the directory.
        </p>

        <div className="steps">
          <div className="step">
            <div className="step-num">01</div>
            <div className="step-label">Submit your details</div>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <div className="step-label">We verify your licence</div>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <div className="step-label">You're live in the directory</div>
          </div>
        </div>

        {status && (
          <div className={`status-message ${status.type}`}>{status.message}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Trade</label>
              <input
                required
                value={form.trade}
                onChange={(e) => update("trade", e.target.value)}
                placeholder="Electrician"
              />
            </div>
            <div className="field">
              <label>Business name</label>
              <input
                required
                value={form.business_name}
                onChange={(e) => update("business_name", e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Your name</label>
              <input
                required
                value={form.contact_name}
                onChange={(e) => update("contact_name", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Suburb</label>
              <input
                required
                value={form.suburb}
                onChange={(e) => update("suburb", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Phone <span className="hint">(optional)</span></label>
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Licence number</label>
              <input
                value={form.license_number}
                onChange={(e) => update("license_number", e.target.value)}
                placeholder="e.g. QBCC or Energy Safety licence #"
              />
            </div>
            <div className="field">
              <label>Licensing body</label>
              <input
                value={form.licensing_body}
                onChange={(e) => update("licensing_body", e.target.value)}
                placeholder="QBCC, Energy Safety QLD, etc."
              />
            </div>
          </div>

          <div className="field">
            <label>Your story <span className="hint">(optional)</span></label>
            <textarea
              value={form.story}
              onChange={(e) => update("story", e.target.value)}
              placeholder="A line or two about your business and what matters to you in your work."
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Photo URL <span className="hint">(optional)</span></label>
              <input
                value={form.photo_url}
                onChange={(e) => update("photo_url", e.target.value)}
                placeholder="Link to a photo of you or your work"
              />
            </div>
            <div className="field">
              <label>Referred by <span className="hint">(optional)</span></label>
              <input
                value={form.referred_by}
                onChange={(e) => update("referred_by", e.target.value)}
                placeholder="Who told you about Cornerstone Trades?"
              />
            </div>
          </div>

          <div className="checkbox-field">
            <input
              type="checkbox"
              id="public_directory"
              checked={form.public_directory}
              onChange={(e) => update("public_directory", e.target.checked)}
            />
            <label htmlFor="public_directory">
              <span>
                List my business in the public directory once verified. (If unticked, your
                profile is kept on file but won't appear in search.)
              </span>
            </label>
          </div>

          <div className="form-submit-row">
            <button type="submit" className="btn btn-gold" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit for verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
