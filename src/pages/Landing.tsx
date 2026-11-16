import { lazy, Suspense, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CARS, carImage, formatKm, formatPrice } from "../data/cars";
import { FOUNDER, SITE, waLink } from "../data/site";
import { Button, Tag, img } from "../components/ui";
import { PAINTS, type PaintId } from "../three/RealCar";
import { HERO_START, hero } from "../three/heroState";
import { DUR, EASE, ScrollTrigger, gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { SplitReveal } from "../motion/primitives";

const HeroStage = lazy(() => import("../three/HeroStage"));

/* ====================================================================== hero */

/**
 * Text on the right, the car on the left. The section holds for ~2 screens of scroll:
 *   0.00–0.45  the car spins its wheels in place, the floor streams, it turns to a side profile
 *   0.45–1.00  lights on, it launches out of frame to the left
 * The speed lines over the stage follow the car's speed (and the visitor's scroll speed).
 */
function Hero() {
  const root = useRef<HTMLElement>(null);
  const [paint, setPaint] = useState<PaintId>("carmine");

  useGSAP(
    () => {
      Object.assign(hero, HERO_START);
      const rm = reducedMotion();
      const speed = gsap.quickSetter(root.current, "--speed");
      if (rm) return;

      // arrival: the car drives onto its mark from the right, wheels turning, then settles
      hero.enter = 9;
      gsap.to(hero, { enter: 0, duration: 1.6, ease: "expo.out", delay: 0.25 });
      gsap.from(".hero-copy > *:not(h1)", { x: -80, autoAlpha: 0, duration: 0.8, ease: EASE.out, stagger: 0.07, delay: 0.5 });

      const state = { s: 0 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=190%",
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            // speed lines: the story's own speed plus a kick from how fast the visitor scrolls
            const kick = Math.min(1, Math.abs(self.getVelocity()) / 4000);
            speed(Math.min(1, state.s + kick * 0.5));
          },
        },
      });
      tl.to(hero, { road: 26, duration: 4.5, ease: "power2.in" }, 0)
        .to(state, { s: 0.75, duration: 4.5, ease: "power2.in" }, 0)
        .to(hero, { yaw: -Math.PI / 2, zoom: 0.15, pan: 0.9, duration: 3, ease: "sine.inOut" }, 0.5)
        .to(".hero-copy", { x: 160, autoAlpha: 0, duration: 1.6, ease: "power2.in" }, 0.6)
        .fromTo(".hero-second", { x: -140, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1.4, ease: "power3.out" }, 2.1)
        .to(hero, { lights: 1, duration: 0.6 }, 4.2)
        .to(hero, { drive: 24, zoom: 0, duration: 3.6, ease: "power3.in" }, 4.6)
        .to(state, { s: 1, duration: 1.6 }, 4.6)
        .to(".hero-second", { x: 200, autoAlpha: 0, duration: 1.2, ease: "power2.in" }, 7.4)
        .to(".hero-progress i", { scaleX: 1, duration: 8.6 }, 0);
    },
    { scope: root },
  );

  return (
    <section className="hero" ref={root} aria-label="Pro Drive">
      <Suspense fallback={<div className="hero-canvas" />}>
        <HeroStage paint={paint} />
      </Suspense>
      <div className="speed-lines" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <i key={i} style={{ ["--y" as string]: `${8 + ((i * 37) % 84)}%`, ["--d" as string]: `${0.5 + ((i * 13) % 7) / 10}s`, ["--w" as string]: `${18 + ((i * 29) % 30)}%` }} />
        ))}
      </div>

      <div className="hero-copy">
        <SplitReveal as="h1" className="hero-title" immediate>
          מוצאים לך רכב. מהר.
        </SplitReveal>
        <p className="hero-lead">
          Pro Drive הוא תיווך רכב שעובד רק בשבילך: מאתרים, בודקים ומתמקחים – ואתה מגיע רק לקחת מפתח.
        </p>
        <div className="hero-actions">
          <Button href={waLink("היי, אני מחפש רכב ואשמח לשיחה")} size="lg">
            ספרו לי מה אתם מחפשים
          </Button>
          <a className="text-link" href="#cars">לרכבים שבדקנו</a>
        </div>
        <div className="swatches" role="radiogroup" aria-label="צבע הרכב">
          {(Object.keys(PAINTS) as PaintId[]).map((id) => (
            <button
              key={id}
              role="radio"
              aria-checked={paint === id}
              aria-label={PAINTS[id].label}
              className={`swatch ${paint === id ? "is-on" : ""}`}
              style={{ ["--c" as string]: PAINTS[id].color }}
              onClick={() => setPaint(id)}
            />
          ))}
        </div>
      </div>

      <div className="hero-second">
        <h2>שלושה רכבים מתאימים. שבוע אחד.</h2>
        <ul className="hero-facts">
          <li><b>0 ₪</b><span>עמלות ממוכרים – אני עובד רק בשבילך</span></li>
          <li><b>120</b><span>נקודות בדיקה לכל רכב לפני שאתה רואה אותו</span></li>
          <li><b>1</b><span>טלפון אישי, מהשיחה הראשונה ועד המסירה</span></li>
        </ul>
      </div>

      <div className="hero-progress" aria-hidden="true"><i /></div>
    </section>
  );
}

/* ====================================================================== words band */

const WORDS = ["מאתרים", "בודקים", "מתמקחים", "מוסרים"];

/** Big condensed words racing sideways; scroll speed skews them and speeds them up. */
function WordsBand() {
  const track = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (reducedMotion() || !track.current) return;
    const loop = gsap.fromTo(track.current, { xPercent: -50 }, { xPercent: 0, duration: 18, ease: "none", repeat: -1 });
    const skew = gsap.quickTo(track.current, "skewX", { duration: 0.4, ease: "power3.out" });
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-14, 14, self.getVelocity() / 220);
        skew(v);
        loop.timeScale(1 + Math.abs(v) / 3);
      },
    });
    return () => {
      loop.kill();
      st.kill();
    };
  });
  const row = [...WORDS, ...WORDS, ...WORDS, ...WORDS];
  return (
    <div className="words-band" aria-label={WORDS.join(", ")}>
      <div className="words-track" ref={track} aria-hidden="true">
        {row.map((w, i) => (
          <span key={i}>{w}<i /></span>
        ))}
      </div>
    </div>
  );
}

/* ====================================================================== short catalog */

/** Six checked cars in a row the visitor can drag or swipe; cards lean in on arrival. */
function ShortCatalog() {
  const root = useRef<HTMLElement>(null);
  const row = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(".car-tile", { x: -120, skewX: 8, autoAlpha: 0, duration: 0.9, ease: EASE.out, stagger: 0.07, scrollTrigger: { trigger: row.current, start: "top 85%", once: true } });
      // the whole row drifts a little against the scroll for depth
      gsap.fromTo(row.current, { x: -60 }, { x: 60, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    },
    { scope: root },
  );

  // drag to scroll with the mouse (touch scrolls natively)
  const drag = useRef({ on: false, x: 0, left: 0 });
  const down = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !row.current) return;
    drag.current = { on: true, x: e.clientX, left: row.current.scrollLeft };
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current.on || !row.current) return;
    row.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const up = () => (drag.current.on = false);

  return (
    <section className="cars section" id="cars" ref={root} aria-labelledby="cars-h">
      <div className="wrap cars-head">
        <h2 id="cars-h">רכבים שבדקנו השבוע.</h2>
        <p>לכל רכב: מה המוכר ביקש, ומחיר היעד שלנו במשא ומתן.</p>
        <Link className="text-link" to="/catalog">לכל הקטלוג</Link>
      </div>
      <div className="car-row" ref={row} data-lenis-prevent-wheel onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
        {CARS.slice(0, 6).map((c) => (
          <Link to={`/catalog?car=${c.id}`} className="car-tile" key={c.id} draggable={false}>
            <span className="car-tile-pic">
              <img src={carImage(c)} alt="" loading="lazy" draggable={false} />
            </span>
            <span className="car-tile-body">
              <Tag tone="accent">חוסכים {formatPrice(c.asked - c.target)}</Tag>
              <b className="car-tile-name">{c.make} {c.model}</b>
              <span className="car-tile-meta">{c.year} · יד {c.hand} · {formatKm(c.km)}</span>
              <span className="car-tile-price">
                <s>{formatPrice(c.asked)}</s>
                <b>{formatPrice(c.target)}</b>
              </span>
            </span>
          </Link>
        ))}
        <Link to="/catalog" className="car-tile car-tile-more" draggable={false}>
          <b>עוד {CARS.length - 6} רכבים</b>
          <span>לקטלוג המלא</span>
        </Link>
      </div>
      <p className="wrap note">רכבים ומחירים לדוגמה; התמונות הן הדמיה.</p>
    </section>
  );
}

/* ====================================================================== about */

function About() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.fromTo(".about-pic", { clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)" }, { clipPath: "polygon(8% 0, 100% 0, 92% 100%, 0 100%)", duration: 1.3, ease: "expo.inOut", scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
      gsap.fromTo(".about-pic img", { scale: 1.25, xPercent: -6 }, { scale: 1.05, xPercent: 4, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from(".about-text > *", { y: 30, autoAlpha: 0, duration: DUR.base, ease: EASE.out, stagger: 0.08, scrollTrigger: { trigger: root.current, start: "top 65%", once: true } });
    },
    { scope: root },
  );
  return (
    <section className="about section" id="about" ref={root} aria-labelledby="about-h">
      <div className="wrap about-grid">
        <div className="about-text">
          <h2 id="about-h">נעים להכיר, {FOUNDER.name.split(" ")[0]}.</h2>
          <p className="about-lead">{FOUNDER.intro[0]}</p>
          <p>{FOUNDER.intro[1]}</p>
          <ul className="about-facts">
            <li><b>2008</b><span>הרכב הראשון שמכרתי</span></li>
            <li><b>2016</b><span>עברתי צד – רק בשביל הקונה</span></li>
            <li><b>היום</b><span>עדיין נוהג בכל רכב לפני שאני ממליץ</span></li>
          </ul>
          <div className="about-actions">
            <Button to="/about">הסיפור המלא</Button>
            <span className="about-sign">{FOUNDER.name}, {FOUNDER.role}</span>
          </div>
        </div>
        <figure className="about-pic">
          <img src={img(FOUNDER.photo || "d-seat.webp")} alt={FOUNDER.photo ? FOUNDER.name : "תא הנהג – מקום לתמונה של הבעלים"} loading="lazy" />
          {!FOUNDER.photo && <figcaption>כאן תיכנס התמונה שלך</figcaption>}
        </figure>
      </div>
    </section>
  );
}

/* ====================================================================== contact */

function Contact() {
  const word = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.fromTo(word.current, { xPercent: -30 }, { xPercent: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: true } });
    },
    { scope: root },
  );
  return (
    <section className="contact" id="contact" ref={root} aria-labelledby="contact-h">
      <div className="wrap contact-inner">
        <h2 id="contact-h" className="sr-only">יצירת קשר</h2>
        <span className="contact-word" ref={word} aria-hidden="true">בואו ניסע.</span>
        <div className="contact-row">
          <p>שיחה של עשר דקות בוואטסאפ, ואני יוצא לחפש.</p>
          <Button href={waLink("היי, אני מחפש רכב ואשמח לשיחה")} tone="accent" size="lg">כתבו לי בוואטסאפ</Button>
          <a className="contact-phone" href={SITE.phoneHref} dir="ltr">{SITE.phone}</a>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <Hero />
      <WordsBand />
      <ShortCatalog />
      <About />
      <Contact />
    </>
  );
}
