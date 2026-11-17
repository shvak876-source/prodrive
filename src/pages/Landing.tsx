import { lazy, Suspense, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CARS, carImage, formatKm, formatPrice } from "../data/cars";
import { FOUNDER, SITE, waLink } from "../data/site";
import { Button, Tag, img } from "../components/ui";
import { PAINTS, type PaintId } from "../three/paints";
import { HERO_START, hero } from "../three/heroState";
import { DUR, EASE, ScrollTrigger, SplitText, gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { ScrollFrames, useFrameSet, type ScrollFramesHandle } from "../components/ScrollFrames";

const TrackHero = lazy(() => import("../three/TrackHero"));

const TITLE = "מוצאים לך רכב. מהר.";
const SUB = "תיווך רכב שעובד רק בשבילך";

/* ====================================================================== hero + catalog */

/**
 * The landing shot: the car at a low front three-quarter angle on a track, filmed against a real
 * horizon; the headline sits in the sky beside it. Pinned scroll:
 *   0.0–1.1  the scissor doors swing up while the camera walks toward the open door
 *   1.1–2.2  the camera goes in through the door and settles in the seat, looking out
 *   2.2–…    the catalog rises over the cabin view and its cards slide past with the scroll
 * The story is pre-rendered into frames (public/frames, scripts/shoot-frames.mjs) and scrubbed like
 * film; without frames the same scene runs live in 3D.
 */
function HeroCatalog() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [paint, setPaint] = useState<PaintId>("carmine");
  const [ready, setReady] = useState(false);
  const cars = CARS.slice(0, 6);
  const frames = useFrameSet();
  const film = useRef<ScrollFramesHandle>(null);

  useGSAP(
    () => {
      if (frames === undefined) return; // still checking for footage
      Object.assign(hero, HERO_START);
      if (reducedMotion()) return;
      gsap.set(".cat-panel", { yPercent: 102 });
      const t = track.current!;
      // RTL: the card row overflows to the left, so it travels right to show its last card
      const travel = () => Math.max(0, t.scrollWidth - t.clientWidth);
      const clip = { p: 0 };

      if (!frames) {
        // arrival: the car rolls forward onto its mark
        hero.enter = 6;
        gsap.to(hero, { enter: 0, duration: 2.0, ease: "expo.out", delay: 0.2 });
      }
      const words = new SplitText(".hero-title", { type: "words", mask: "words" });
      gsap.from(words.words, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.35 });
      gsap.from([".hero-kicker", ".hero-side > *"], { y: 30, autoAlpha: 0, duration: 0.9, ease: EASE.out, stagger: 0.08, delay: 0.6 });
      gsap.from(".hero-scrim", { autoAlpha: 0, duration: 1.2, ease: "power2.out" });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${window.innerHeight * 2.8 + travel()}`, pin: true, scrub: true, invalidateOnRefresh: true },
      });
      if (frames) tl.to(clip, { p: 1, duration: 2.2, onUpdate: () => film.current?.seek(clip.p) }, 0);
      else
        tl.to(hero, { doors: 1, lights: 1, duration: 0.8, ease: "power2.inOut" }, 0.15)
          .to(hero, { cam: 0.45, duration: 1.0, ease: "power1.inOut" }, 0.1)
          .to(hero, { cam: 1, duration: 1.1, ease: "power2.inOut" }, 1.1);
      tl.to(".hero-copy", { y: 60, autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0.05)
        .to(".hero-scrim", { autoAlpha: 0, duration: 0.4 }, 0.05)
        .fromTo(".door-copy", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: "power3.out" }, 0.75)
        .to(".door-copy", { y: -40, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, 1.75)
        .to(".cat-panel", { yPercent: 0, duration: 0.7, ease: "power3.out" }, 2.2)
        .from(".rc-card", { y: 80, autoAlpha: 0, stagger: 0.06, duration: 0.5, ease: "power3.out" }, 2.5)
        .to(t, { x: () => travel(), duration: 3.2 }, 3.0)
        .to(".hero-progress i", { scaleX: 1, duration: 6.2 }, 0);
    },
    { scope: root, dependencies: [frames] },
  );

  return (
    <section className="hero" ref={root} aria-labelledby="hero-h">
      {frames ? (
        <ScrollFrames ref={film} set={frames} className="hero-film" onFirstFrame={() => setReady(true)} />
      ) : frames === null ? (
        <Suspense fallback={<div className="hero-canvas" />}>
          <TrackHero paint={paint} onReady={() => setReady(true)} />
        </Suspense>
      ) : null}
      <div className={`stage-loader ${ready ? "is-done" : ""}`} aria-hidden="true"><i /></div>

      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-copy">
        <div className="hero-head">
          <p className="hero-kicker">PRO DRIVE · תיווך רכב</p>
          <h1 id="hero-h" className="hero-title">{TITLE}</h1>
        </div>
        <div className="hero-side">
        <p className="hero-lead">{SUB}: מאתרים, בודקים ומתמקחים – ואתה רק לוקח מפתח.</p>
        <div className="hero-actions">
          <Button href={waLink("היי, אני מחפש רכב ואשמח לשיחה")} size="lg" tone="accent">
            ספרו לי מה אתם מחפשים
          </Button>
          {!frames && (
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
          )}
        </div>
      </div>
      </div>

      <div className="door-copy">
        <h2>נכנסים פנימה.</h2>
        <p>כל רכב נבדק מבפנים ומבחוץ – היסטוריה, תאונות, קילומטראז׳ ומכון.</p>
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
