import { useRef } from "react";
import { Link } from "react-router-dom";
import { FOUNDER, SITE } from "../data/site";
import { gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { Parallax, SplitReveal, useReveal } from "../motion/primitives";

/** Initials monogram shown until a real portrait is added (FOUNDER.photo). */
function Portrait() {
  if (FOUNDER.photo) return <img src={FOUNDER.photo} alt={FOUNDER.name} />;
  return (
    <div className="portrait-placeholder" role="img" aria-label="מקום לתמונת הבעלים">
      <svg viewBox="0 0 200 240" aria-hidden="true">
        <circle cx="100" cy="88" r="42" />
        <path d="M24 240c6-52 38-84 76-84s70 32 76 84z" />
      </svg>
      <span>כאן תיכנס התמונה שלך</span>
    </div>
  );
}

export default function About() {
  const scope = useReveal<HTMLDivElement>();
  const timeline = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      // portrait frame un-masks from the bottom on load
      gsap.from(".portrait-frame", { clipPath: "inset(100% 0 0 0)", duration: 1.6, ease: "expo.inOut", delay: 0.2 });
      // timeline rail fills while the list scrolls past
      gsap.fromTo(
        ".tl-rail i",
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".tl", start: "top 70%", end: "bottom 70%", scrub: true } },
      );
    },
    { scope },
  );

  return (
    <div className="about-page" ref={scope}>
      <section className="about-hero">
        <div className="container about-hero-grid">
          <div className="about-hero-copy">
            <p className="eyebrow">עלינו · האיש שמאחורי Pro Drive</p>
            <SplitReveal as="h1" className="display" immediate>
              {FOUNDER.name}
            </SplitReveal>
            <p className="about-role">{FOUNDER.role}</p>
            <blockquote className="about-quote" data-reveal>״{FOUNDER.quote}״</blockquote>
          </div>
          <Parallax speed={12} className="portrait-wrap">
            <div className="portrait-frame">
              <Portrait />
            </div>
            <div className="portrait-tag">
              <b>PRO</b>DRIVE
            </div>
          </Parallax>
        </div>
      </section>

      <section className="section about-story">
        <div className="container story-grid">
          <div className="story-aside">
            <p className="eyebrow" data-reveal>הסיפור</p>
            <SplitReveal>איך הכול התחיל.</SplitReveal>
          </div>
          <div className="story-body">
            {FOUNDER.intro.map((p, i) => (
              <p key={i} data-reveal className={i === 0 ? "story-lead" : undefined}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-timeline">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow" data-reveal>הדרך</p>
            <SplitReveal>ציוני דרך.</SplitReveal>
          </div>
          <ol className="tl" ref={timeline}>
            <span className="tl-rail" aria-hidden="true"><i /></span>
            {FOUNDER.timeline.map((t) => (
              <li key={t.year + t.title} data-reveal>
                <span className="tl-year">{t.year}</span>
                <div>
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section about-values">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow" data-reveal>במה אני מאמין</p>
            <SplitReveal>שלושה דברים שלא מתפשרים עליהם.</SplitReveal>
          </div>
          <div className="values-grid">
            {FOUNDER.values.map((v, i) => (
              <article className="value" key={v.title} data-reveal>
                <span>0{i + 1}</span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-cta">
        <div className="container cta-box" data-reveal>
          <h2>בואו נכיר באולם.</h2>
          <p className="lead">קפה, נסיעת מבחן ושיחה פתוחה – בלי התחייבות.</p>
          <div className="btn-row">
            <Link to="/#contact" className="btn btn-accent">תיאום פגישה</Link>
            <a href={SITE.phoneHref} className="btn btn-ghost">{SITE.phone}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
