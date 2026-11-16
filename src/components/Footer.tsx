import { Link } from "react-router-dom";
import { SITE } from "../data/site";
import { Logo } from "./Header";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted footer-tag">סוכנות רכב פרימיום. רכבים חדשים, 0 ק״מ ויד ראשונה – עם ליווי אישי מהשיחה הראשונה ועד המפתח.</p>
        </div>
        <div>
          <h4>ניווט</h4>
          <Link to="/">ראשי</Link>
          <Link to="/catalog">קטלוג רכבים</Link>
          <Link to="/about">עלינו</Link>
          <Link to="/#contact">צור קשר</Link>
        </div>
        <div>
          <h4>יצירת קשר</h4>
          <a href={SITE.phoneHref}>{SITE.phone}</a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <span>{SITE.address}</span>
        </div>
        <div>
          <h4>שעות פעילות</h4>
          <span>{SITE.hours}</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Pro Drive. כל הזכויות שמורות.</span>
        <span className="footer-big" aria-hidden="true">PRO DRIVE</span>
      </div>
    </footer>
  );
}
