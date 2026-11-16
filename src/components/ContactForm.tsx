import { useState, type FormEvent } from "react";
import { CARS } from "../data/cars";

/**
 * Lead form. Not wired to a backend yet – on submit it shows a confirmation.
 * Hook `onSubmit` to email / CRM / WhatsApp when going live.
 */
export function ContactForm({ defaultModel = "", compact = false }: { defaultModel?: string; compact?: boolean }) {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    setSent(true);
  };
  if (sent)
    return (
      <div className="form-done" role="status">
        <span className="form-done-icon" aria-hidden="true">✓</span>
        <h3>קיבלנו, תודה!</h3>
        <p className="muted">נציג Pro Drive יחזור אליך בהקדם לתיאום.</p>
      </div>
    );
  return (
    <form className={`form ${compact ? "form-compact" : ""}`} onSubmit={submit} noValidate>
      <label>
        <span>שם מלא</span>
        <input name="name" required autoComplete="name" placeholder="ישראל ישראלי" />
      </label>
      <label>
        <span>טלפון</span>
        <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9\-+ ]{9,}" placeholder="050-0000000" dir="ltr" />
      </label>
      <label className="span-2">
        <span>איזה רכב מעניין אותך?</span>
        <select name="model" defaultValue={defaultModel}>
          <option value="">עדיין מתלבט/ת – אשמח להמלצה</option>
          {CARS.map((c) => (
            <option key={c.id} value={c.id}>{c.make} {c.model}</option>
          ))}
        </select>
      </label>
      <button className="btn btn-accent span-2" type="submit">תאמו לי נסיעת מבחן</button>
      <p className="form-note span-2">בלחיצה אתם מאשרים שנחזור אליכם טלפונית. בלי ספאם.</p>
    </form>
  );
}
