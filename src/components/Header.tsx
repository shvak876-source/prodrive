import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useLenis } from "lenis/react";
import { SITE } from "../data/site";

/** Wordmark – original geometric mark + type. */
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Pro Drive – דף הבית">
      <svg viewBox="0 0 40 24" aria-hidden="true">
        <path d="M2 20 L12 4 H38 L28 20 Z" fill="currentColor" className="logo-mark" />
        <path d="M14 15 H26" stroke="#0a0a0c" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span>
        PRO<b>DRIVE</b>
      </span>
    </Link>
  );
}

/** Sticky header: transparent over the hero, solid glass once the page scrolls. */
export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useLenis(({ scroll }) => setSolid(scroll > 40));
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header className={`site-header ${solid ? "is-solid" : ""} ${open ? "is-open" : ""}`}>
      <div className="container header-row">
        <Logo />
        <nav className="nav" aria-label="ניווט ראשי">
          <NavLink to="/" end>ראשי</NavLink>
          <NavLink to="/catalog">קטלוג רכבים</NavLink>
          <NavLink to="/about">עלינו</NavLink>
          <Link to="/#contact">צור קשר</Link>
        </nav>
        <div className="header-cta">
          <a className="header-phone" href={SITE.phoneHref}>{SITE.phone}</a>
          <Link to="/#contact" className="btn btn-accent btn-sm">תיאום נסיעת מבחן</Link>
        </div>
        <button className="burger" aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span /><span />
        </button>
      </div>
    </header>
  );
}
