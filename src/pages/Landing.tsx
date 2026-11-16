import { lazy, Suspense, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CARS, carImage, formatKm, formatPrice } from "../data/cars";
import { FOUNDER, SITE, waLink } from "../data/site";
import { Button, Tag, img } from "../components/ui";
import { PAINTS, type PaintId } from "../three/paints";
import { HERO_START, hero } from "../three/heroState";
import { DUR, EASE, ScrollTrigger, gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { SplitReveal } from "../motion/primitives";
import { ScrollFrames, useFrameSet, type ScrollFramesHandle } from "../components/ScrollFrames";

const RoadStage = lazy(() => import("../three/RoadStage"));

/* ====================================================================== hero + catalog */

/**
 * One pinned scene, ~4 screens of scroll:
 *   0.0–1.4  the copy steps aside, the scissor doors swing up, the camera moves toward the open door
 *   1.4–2.2  the doors drop, the catalog panel rises from the road and the car rides up above it
 *   2.2–6.0  the catalog cards slide past (scroll moves them sideways, 1:1)
 * The road keeps streaming the whole time, so the car is never parked.
 */
function HeroCatalog() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [paint, setPaint] = useState<PaintId>("carmine");
  const [ready, setReady] = useState(false);
  const cars = CARS.slice(0, 6);
  // real footage when public/frames/manifest.json exists, otherwise the 3D road scene
  const frames = useFrameSet();
  const film = useRef<ScrollFramesHandle>(null);

  useGSAP(
    () => {
      if (frames === undefined) return; // still checking for footage
      Object.assign(hero, HERO_START);
      if (reducedMotion()) {
        hero.cruise = 0;
        return;
      }
      gsap.set(".cat-panel", { yPercent: 102 });
      const t = track.current!;
      const travel = () => Math.max(0, t.scrollWidth - t.clientWidth);

      if (frames) {
        // FOOTAGE: the clip plays with the scroll – car on the track, the door opens, the camera
        // goes in through it – then the catalog rises over the last (interior) frame.
        gsap.from(".hero-copy > *:not(h1)", { x: -80, autoAlpha: 0, duration: 0.8, ease: EASE.out, stagger: 0.07, delay: 0.3 });
        const clip = { p: 0 };
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${window.innerHeight * 3.2 + travel()}`, pin: true, scrub: true, invalidateOnRefresh: true },
        });
        tl.to(clip, { p: 1, duration: 3, onUpdate: () => film.current?.seek(clip.p) }, 0)
          .to(".hero-copy", { x: 120, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 0.25)
          .fromTo(".door-copy", { x: -100, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" }, 0.6)
          .to(".door-copy", { x: 100, autoAlpha: 0, duration: 0.35, ease: "power2.in" }, 1.25)
          .to(".hero-side", { xPercent: 105, duration: 0.5, ease: "power2.in" }, 1.3)
          .to(".cat-panel", { yPercent: 0, duration: 0.7, ease: "power3.out" }, 3.0)
          .from(".rc-card", { y: 80, autoAlpha: 0, stagger: 0.06, duration: 0.5, ease: "power3.out" }, 3.3)
          .to(t, { x: () => travel(), duration: 3.4 }, 3.8)
          .to(".hero-progress i", { scaleX: 1, duration: 7.2 }, 0);
        return;
      }
      // arrival: the car rolls onto its mark, the copy follows a beat later
      hero.enter = 14;
      gsap.to(hero, { enter: 0, duration: 2, ease: "expo.out", delay: 0.2 });
      gsap.from(".hero-copy > *:not(h1)", { x: -80, autoAlpha: 0, duration: 0.8, ease: EASE.out, stagger: 0.07, delay: 0.6 });

      // 3D fallback (no footage yet)
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${window.innerHeight * 2.2 + travel()}`, pin: true, scrub: true, invalidateOnRefresh: true },
      });
      tl.to(".hero-copy", { x: 120, autoAlpha: 0, duration: 0.6, ease: "power2.in" }, 0)
        .to(hero, { doors: 1, zoom: 1, lights: 1, cruise: 0.6, duration: 1.1, ease: "power2.inOut" }, 0.15)
        .fromTo(".door-copy", { x: -100, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, 0.55)
        .to(".door-copy", { x: 100, autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 1.3)
        .to(hero, { doors: 0, zoom: 0.15, panel: 1, cruise: 3, duration: 0.8, ease: "power2.inOut" }, 1.35)
        .to(".cat-panel", { yPercent: 0, duration: 0.8, ease: "power3.out" }, 1.4)
        .to(".hero-side", { xPercent: 105, duration: 0.6, ease: "power2.in" }, 1.3)
        .from(".rc-card", { y: 80, autoAlpha: 0, stagger: 0.06, duration: 0.5, ease: "power3.out" }, 1.75)
        .to(t, { x: () => travel(), duration: 3.6 }, 2.3)
        .to(".hero-progress i", { scaleX: 1, duration: 5.9 }, 0);
    },
    { scope: root, dependencies: [frames] },
  );

  return (
    <section className={`hero ${frames ? "is-film" : ""}`} ref={root} aria-label="Pro Drive – תיווך רכב">
      {frames ? (
        <ScrollFrames ref={film} set={frames} className="hero-film" onFirstFrame={() => setReady(true)} />
      ) : frames === null ? (
        <Suspense fallback={<div className="hero-canvas" />}>
          <RoadStage paint={paint} onReady={() => setReady(true)} />
        </Suspense>
      ) : null}
      <div className={`stage-loader ${ready ? "is-done" : ""}`} aria-hidden="true">
        <i />
      </div>

      {/* light panel the copy sits on, leaning with the page's slant */}
      <div className="hero-side" aria-hidden="true" />
      <div className="hero-copy">
        <SplitReveal as="h1" className="hero-title" immediate>
          מוצאים לך רכב. מהר.
        </SplitReveal>
        <p className="hero-lead">Pro Drive הוא תיווך רכב שעובד רק בשבילך: מאתרים, בודקים ומתמקחים – ואתה מגיע רק לקחת מפתח.</p>
        <div className="hero-actions">
          <Button href={waLink("היי, אני מחפש רכב ואשמח לשיחה")} size="lg">
            ספרו לי מה אתם מחפשים
          </Button>
          <a className="text-link" href="#about">מי אני</a>
        </div>
        {!frames && <div className="swatches" role="radiogroup" aria-label="צבע הרכב">
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
        </div>}
      </div>

      <div className="door-copy">
        <h2>פותחים כל דלת.</h2>
        <p>היסטוריה, תאונות, קילומטראז׳ אמיתי ובדיקה במכון – לפני שאתה בכלל רואה את הרכב.</p>
      </div>

      <div className="cat-panel" id="cars">
        <div className="cat-panel-head">
          <h2>רכבים שבדקנו השבוע.</h2>
          <p>מה המוכר ביקש, ומה מחיר היעד שלנו.</p>
          <Link className="text-link" to="/catalog">לקטלוג המלא</Link>
        </div>
        <div className="cat-track-wrap">
          <div className="cat-track" ref={track}>
            {cars.map((c) => (
              <Link to={`/catalog?car=${c.id}`} className="rc-card" key={c.id}>
                <span className="rc-pic"><img src={carImage(c)} alt="" loading="lazy" /></span>
                <span className="rc-body">
                  <Tag tone="accent">חוסכים {formatPrice(c.asked - c.target)}</Tag>
                  <b className="rc-name">{c.make} {c.model}</b>
                  <span className="rc-meta">{c.year} · יד {c.hand} · {formatKm(c.km)}</span>
                  <span className="rc-price">
                    <s>{formatPrice(c.asked)}</s>
                    <b>{formatPrice(c.target)}</b>
                  </span>
                </span>
              </Link>
            ))}
            <Link to="/catalog" className="rc-card rc-more">
              <b>עוד {CARS.length - cars.length} רכבים</b>
              <span>לקטלוג המלא</span>
            </Link>
          </div>
        </div>
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
      <HeroCatalog />
      <WordsBand />
      <About />
      <Contact />
    </>
  );
}
