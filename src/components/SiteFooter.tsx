import { useRef } from "react";
import { Link } from "react-router-dom";
import { SITE, waLink } from "../data/site";
import { gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { PlateButton } from "./Plate";

const LETTERS = ["P", "R", "O", "D", "R", "I", "V", "E"];
// heights of the letter blocks (% of the band); bottoms on one line
const HEIGHTS = [78, 92, 64, 100, 72, 86, 60, 94];

/** The name closes the page as a construction: each letter knocked out of its own plate block. */
export function SiteFooter() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      // blocks rise to their heights as the footer scrolls in (scrubbed)
      gsap.from(".foot-mark span", {
        scaleY: 0.1,
        ease: "none",
        stagger: 0.06,
        scrollTrigger: { trigger: ".foot-mark", start: "top bottom", end: "bottom 85%", scrub: true },
      });
    },
    { scope: ref },
  );
  return (
    <footer className="site-footer" ref={ref}>
      <div className="wrap">
        <div className="foot-mark" aria-label="Pro Drive">
          <span className="il" style={{ height: "100%" }} aria-hidden="true">IL</span>
          {LETTERS.map((l, i) => (
            <span key={i} style={{ height: `${HEIGHTS[i]}%` }} aria-hidden="true">{l}</span>
          ))}
        </div>
        <div className="foot-grid">
          <div className="links">
            <h4>האתר</h4>
            <Link to="/">תיווך רכב</Link>
            <Link to="/catalog">רכבים שנבדקו</Link>
            <Link to="/about">מי אני</Link>
            <Link to="/#faq">שאלות</Link>
          </div>
          <div className="links">
            <h4>שירותים</h4>
            <span>איתור רכב</span>
            <span>בדיקה לפני קנייה</span>
            <span>משא ומתן</span>
            <span>מימון וטרייד-אין</span>
          </div>
          <div className="contact">
            <h4>יצירת קשר</h4>
            <a href={SITE.phoneHref} dir="ltr">{SITE.phone}</a>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <span>{SITE.area}</span>
            <span>{SITE.hours}</span>
          </div>
        </div>
        <div className="foot-last">
          <span>© {new Date().getFullYear()} Pro Drive · תיווך רכב</span>
          <PlateButton href={waLink("היי, אני מחפש רכב")}>וואטסאפ</PlateButton>
        </div>
        <p className="credits">
          מודל התלת-ממד: “Car Concept” מאת Eric Chadwick ו-Darmstadt Graphics Group, על בסיס מודל של Unity Fan, ברישיון{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> (שונו חומרים ולוחית).
          תאורת סטודיו: Poly Haven, CC0. התמונות באתר הן הדמיות של המודל.
        </p>
      </div>
    </footer>
  );
}
