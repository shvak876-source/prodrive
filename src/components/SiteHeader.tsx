import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLenis } from "lenis/react";
import { Button } from "./ui";
import { waLink } from "../data/site";

/** Wordmark: the name set condensed and leaning forward, three speed marks trailing behind it. */
export function Wordmark() {
  return (
    <Link to="/" className="wordmark" aria-label="Pro Drive – דף הבית">
      <span className="wordmark-marks" aria-hidden="true"><i /><i /><i /></span>
      <b>PRO DRIVE</b>
    </Link>
  );
}

/** Plain bar: wordmark, four links, one action. Solid after the first scroll, hides while scrolling down. */
export function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const last = useRef(0);
  const { pathname } = useLocation();
  useLenis(({ scroll }) => {
    setSolid(scroll > 20);
    if (scroll > 500 && scroll > last.current + 2) setHidden(true);
    if (scroll < last.current - 2) setHidden(false);
    last.current = scroll;
  });
  useEffect(() => setOpen(false), [pathname]);
  return (
    <header className={`site-header ${solid ? "is-solid" : ""} ${hidden && !open ? "is-hidden" : ""} ${open ? "is-open" : ""}`}>
      <div className="wrap header-row">
        <Wordmark />
        <nav className="nav" aria-label="ניווט ראשי">
          <Link to="/">ראשי</Link>
          <Link to="/#cars">רכבים</Link>
          <Link to="/#about">עליי</Link>
          <Link to="/#contact">צור קשר</Link>
        </nav>
        <div className="header-cta">
          <Button href={waLink("היי, אני מחפש רכב ואשמח לשיחה")}>בואו נדבר</Button>
        </div>
        <button className="burger" aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
