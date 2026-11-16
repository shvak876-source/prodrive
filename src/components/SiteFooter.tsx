import { Link } from "react-router-dom";
import { SITE } from "../data/site";

/** Closing band: the name at full width, the links, the contact lines and the model credit. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p className="foot-name" aria-hidden="true">PRO DRIVE</p>
        <div className="foot-grid">
          <nav className="foot-col" aria-label="ניווט תחתון">
            <Link to="/">ראשי</Link>
            <Link to="/#cars">רכבים</Link>
            <Link to="/#about">עליי</Link>
            <Link to="/catalog">הקטלוג המלא</Link>
          </nav>
          <div className="foot-col">
            <a href={SITE.phoneHref} dir="ltr">{SITE.phone}</a>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <span>{SITE.area}</span>
            <span>{SITE.hours}</span>
          </div>
        </div>
        <div className="foot-last">
          <span>© {new Date().getFullYear()} Pro Drive · תיווך רכב</span>
          <span className="credits">
            מודל התלת-ממד: “Car Concept”, Eric Chadwick / Darmstadt Graphics Group (על בסיס Unity Fan),{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>, שונו חומרים ולוחית ·
            תאורה: Poly Haven, CC0 · התמונות הן הדמיות של המודל.
          </span>
        </div>
      </div>
    </footer>
  );
}
