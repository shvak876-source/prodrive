import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useLenis } from "lenis/react";
import { PlateButton } from "./Plate";
import { waLink } from "../data/site";

/** Wordmark set as a small plate: blue strip, yellow field, the name. */
export function Wordmark() {
  return (
    <Link to="/" className="wordmark" aria-label="Pro Drive – דף הבית">
      <i aria-hidden="true" />
      <b>PRO·DRIVE</b>
    </Link>
  );
}

/** Plain bar: wordmark, four links, one action. Turns solid after the first scroll, hides while scrolling down. */
export function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const last = useRef(0);
  const { pathname } = useLocation();
  useLenis(({ scroll }) => {
    setSolid(scroll > 20);
    setHidden(scroll > 400 && scroll > last.current + 2);
    if (scroll < last.current - 2) setHidden(false);
    last.current = scroll;
  });
  useEffect(() => setOpen(false), [pathname]);
  return (
    <header className={`site-header ${solid ? "is-solid" : ""} ${hidden && !open ? "is-hidden" : ""} ${open ? "is-open" : ""}`}>
      <div className="wrap header-row">
        <Wordmark />
        <nav className="nav" aria-label="ניווט ראשי">
          <NavLink to="/" end>תיווך רכב</NavLink>
          <NavLink to="/catalog">רכבים שנבדקו</NavLink>
          <NavLink to="/about">מי אני</NavLink>
          <Link to="/#faq">שאלות</Link>
        </nav>
        <div className="header-cta">
          <PlateButton href={waLink("היי, אני מחפש רכב ואשמח לשיחה")}>בואו נדבר</PlateButton>
        </div>
        <button className="burger" aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
