import { useRef } from "react";
import { FOUNDER, waLink } from "../data/site";
import { PlateButton, img } from "../components/Plate";
import { DUR, EASE, gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { SplitReveal } from "../motion/primitives";

export default function AboutPage() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(".ab-portrait", { clipPath: "inset(100% 0 0 0)", duration: 1.5, ease: "expo.inOut", delay: 0.1 });
      gsap.fromTo(".ab-portrait img", { scale: 1.25 }, { scale: 1, duration: 2.2, ease: "expo.out", delay: 0.1 });
      gsap.from(".ab-role, .ab-quote", { y: 24, autoAlpha: 0, stagger: 0.1, duration: DUR.base, ease: EASE.out, delay: 0.5 });
      gsap.utils.toArray<HTMLElement>(".ab-story-body p, .ab-time li, .ab-value").forEach((el) =>
        gsap.from(el, { y: 36, autoAlpha: 0, duration: DUR.base, ease: EASE.out, scrollTrigger: { trigger: el, start: "top 88%", once: true } }),
      );
    },
    { scope: root },
  );
  return (
    <div ref={root}>
      <section className="ab-hero">
        <div className="ab-hero-copy">
          <SplitReveal as="h1" immediate>{FOUNDER.name}</SplitReveal>
          <p className="ab-role">{FOUNDER.role}</p>
          <blockquote className="ab-quote">״{FOUNDER.quote}״</blockquote>
        </div>
        <div className="ab-portrait">
          <span className="strip" aria-hidden="true">IL</span>
          <img src={img(FOUNDER.photo || "d-seat.webp")} alt={FOUNDER.photo ? FOUNDER.name : "תא נהג – מקום לתמונה של הבעלים"} />
          {!FOUNDER.photo && <span className="hint">כאן תיכנס התמונה שלך</span>}
        </div>
      </section>

      <section className="wrap section ab-story" style={{ marginTop: "calc(var(--gap-section) / 2)" }}>
        <h2>איך עברתי צד.</h2>
        <div className="ab-story-body">
          {FOUNDER.intro.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
        </div>
      </section>

      <section className="wrap section" aria-labelledby="tl-h">
        <h2 id="tl-h" className="ab-h2">שבע-עשרה שנה ברכבים.</h2>
        <ol className="ab-time" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {FOUNDER.timeline.map((t) => (
            <li key={t.year}>
              <span className="yr">{t.year}</span>
              <div>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap section" aria-labelledby="val-h">
        <h2 id="val-h" className="ab-h2">שלושה דברים שלא משתנים.</h2>
        <div className="ab-values">
          {FOUNDER.values.map((v) => (
            <article className="ab-value" key={v.title}>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </article>
          ))}
        </div>
        <div style={{ marginTop: 48 }}>
          <PlateButton href={waLink("היי דניאל, אשמח לדבר על רכב")} size="lg">דברו איתי ישירות</PlateButton>
        </div>
      </section>
    </div>
  );
}
