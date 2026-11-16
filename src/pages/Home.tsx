import { lazy, Suspense, useRef } from "react";
import { Link } from "react-router-dom";
import { CARS } from "../data/cars";
import { SITE } from "../data/site";
import { CarCard } from "../components/CarCard";
import { ContactForm } from "../components/ContactForm";
import { HERO_START, heroState } from "../three/heroState";
import { EASE, ScrollTrigger, gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { Parallax, SplitReveal, useReveal } from "../motion/primitives";

const HeroScene = lazy(() => import("../three/HeroScene"));

/* ------------------------------------------------------------------ hero */

/**
 * Pinned hero. ~3 viewports of scroll scrub one timeline:
 *  0–3   car turns from a 3/4 front view to a full side profile, camera dollies in
 *  3–6.5 the road slides under the car (wheels roll), headlights come on – "specs" copy
 *  6.5–8 car turns its nose toward the exit
 *  8–10.5 car drives out of frame – "come see it" copy with CTAs
 */
function Hero() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      // reset in case we come back to the page
      Object.assign(heroState, HERO_START);
      if (reducedMotion()) {
        heroState.rot = Math.PI + 0.35;
        return;
      }
      const tl = gsap.timeline({
        defaults: { ease: EASE.scrub },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=320%",
          pin: true,
          scrub: true, // boolean: Lenis already smooths the scroll
          anticipatePin: 1,
        },
      });
      tl.to(heroState, { rot: Math.PI, dolly: 0.35, duration: 3, ease: "sine.inOut" }, 0)
        .to(".hero-step-1", { autoAlpha: 0, y: -50, duration: 0.9 }, 1.8)
        .fromTo(".hero-step-2", { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 2.7)
        .to(heroState, { road: 30, duration: 3.5, ease: "power1.in" }, 3) // accelerating in place
        .to(heroState, { lights: 1, duration: 0.8 }, 3.4)
        .fromTo(".spec", { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, stagger: 0.25, duration: 0.6 }, 3.2)
        .to(".hero-step-2", { autoAlpha: 0, y: -50, duration: 0.9 }, 5.8)
        .to(heroState, { rot: Math.PI + 0.28, dolly: 0.1, duration: 1.5, ease: "sine.inOut" }, 6.5)
        .fromTo(".hero-step-3", { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 6.8)
        .to(heroState, { drive: 16, duration: 2.5, ease: "power2.in" }, 8) // floor it
        .to(".hero-progress i", { scaleX: 1, duration: 10.5, ease: "none" }, 0)
        .to(".scroll-hint", { autoAlpha: 0, duration: 0.5 }, 0.2);
    },
    { scope: root },
  );

  return (
    <section className="hero" ref={root} aria-label="Pro Drive">
      <Suspense fallback={<div className="hero-canvas" />}>
        <HeroScene />
      </Suspense>
      <div className="hero-vignette" aria-hidden="true" />
      <div className="container hero-copy">
        <div className="hero-step hero-step-1">
          <p className="eyebrow">סוכנות רכב פרימיום · Pro Drive</p>
          <SplitReveal as="h1" className="display" immediate delay={0.2}>
            הרכב הבא שלך כבר מחכה באולם.
          </SplitReveal>
          <p className="lead">רכבים חדשים, 0 ק״מ ויד ראשונה שנבדקו ב-120 נקודות. מימון מותאם, טרייד-אין הוגן וליווי אישי עד המפתח.</p>
          <div className="btn-row">
            <Link to="/catalog" className="btn btn-accent">לקטלוג הרכבים</Link>
            <Link to="/#contact" className="btn btn-ghost">תיאום נסיעת מבחן</Link>
          </div>
        </div>
        <div className="hero-step hero-step-2" aria-hidden="false">
          <p className="eyebrow">ביצועים שמרגישים</p>
          <h2 className="display">כל רכב באולם עבר את ההגה שלנו קודם.</h2>
          <ul className="specs">
            <li className="spec"><b>120</b><span>נקודות בדיקה לכל רכב</span></li>
            <li className="spec"><b>48</b><span>שעות לאישור מימון</span></li>
            <li className="spec"><b>3</b><span>שנות אחריות מורחבת</span></li>
          </ul>
        </div>
        <div className="hero-step hero-step-3">
          <p className="eyebrow">מוכנים לנסיעה?</p>
          <h2 className="display">בואו לשבת מאחורי ההגה.</h2>
          <p className="lead">נסיעת מבחן אצלנו או עד הבית – בלי התחייבות.</p>
          <div className="btn-row">
            <Link to="/#contact" className="btn btn-accent">קבעו נסיעת מבחן</Link>
            <a href={SITE.phoneHref} className="btn btn-ghost">{SITE.phone}</a>
          </div>
        </div>
      </div>
      <div className="hero-progress" aria-hidden="true"><i /></div>
      <div className="scroll-hint" aria-hidden="true"><span />גללו</div>
    </section>
  );
}

/* --------------------------------------------------------------- marquee */

const MARQUEE = ["רכבים חדשים", "0 ק״מ", "יד ראשונה", "מימון עד 100%", "טרייד-אין", "אחריות מורחבת", "בדיקה ב-120 נקודות", "נסיעת מבחן עד הבית"];

function Marquee() {
  const row = [...MARQUEE, ...MARQUEE];
  return (
    <div className="marquee" aria-label={MARQUEE.join(" · ")}>
      <div className="marquee-track" aria-hidden="true">
        {row.map((t, i) => (
          <span key={i}>{t}<i>✦</i></span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- stats */

const STATS = [
  { n: 15, suffix: "+", label: "שנות ניסיון בענף" },
  { n: 2400, suffix: "+", label: "רכבים נמסרו ללקוחות" },
  { n: 98, suffix: "%", label: "ממליצים עלינו לחברים" },
  { n: 48, suffix: "h", label: "לאישור מימון" },
];

function Intro() {
  const scope = useReveal<HTMLElement>();
  useGSAP(
    () => {
      // numbers count up once when they enter the viewport
      gsap.utils.toArray<HTMLElement>(".stat b").forEach((el) => {
        const end = Number(el.dataset.n);
        if (reducedMotion()) return;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end,
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString("en-US")),
        });
      });
    },
    { scope },
  );
  return (
    <section className="section intro" ref={scope}>
      <div className="container">
        <p className="eyebrow" data-reveal>למה Pro Drive</p>
        <SplitReveal className="statement">
          לא עוד מגרש רכבים. אולם תצוגה שמכבד את הזמן שלך, את הכסף שלך ואת ההחלטה הגדולה שאתה עומד לקבל.
        </SplitReveal>
        <div className="stats">
          {STATS.map((s) => (
            <div className="stat" key={s.label} data-reveal>
              <div className="stat-num">
                <b data-n={s.n}>{s.n.toLocaleString("en-US")}</b>
                <em>{s.suffix}</em>
              </div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- featured */

/** Desktop: pinned section whose card track scrolls sideways (RTL → moves right). Mobile: native swipe. */
function Featured() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const t = track.current!;
        const distance = () => t.scrollWidth - t.clientWidth;
        gsap.to(t, {
          x: () => distance(), // RTL: content overflows to the left, so we pull it right
          ease: "none", // 1:1 with scroll
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  const featured = CARS.slice(0, 7);
  return (
    <section className="featured" ref={root}>
      <div className="container featured-head">
        <div>
          <p className="eyebrow">עכשיו באולם</p>
          <SplitReveal>רכבים נבחרים</SplitReveal>
        </div>
        <Link to="/catalog" className="link-arrow">לכל הקטלוג <span aria-hidden="true">←</span></Link>
      </div>
      <div className="featured-track" ref={track}>
        {featured.map((c) => (
          <Link to={`/catalog?car=${c.id}`} key={c.id} className="featured-item">
            <CarCard car={c} />
          </Link>
        ))}
        <Link to="/catalog" className="featured-more">
          <span>עוד {CARS.length - featured.length} רכבים בקטלוג</span>
          <b aria-hidden="true">←</b>
        </Link>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- services */

const SERVICES = [
  { t: "מימון מותאם אישית", d: "עד 100% מימון, החזר חודשי שנבנה סביב התקציב שלך ואישור תוך 48 שעות.", icon: "M4 12h16M4 7h16M4 17h10" },
  { t: "טרייד-אין הוגן", d: "שמאות שקופה לרכב הנוכחי שלך באותו יום – והסכום יורד ישר מהמחיר.", icon: "M7 7h11l-3-3M17 17H6l3 3" },
  { t: "נסיעת מבחן עד הבית", d: "אנחנו מביאים את הרכב אליך, לנסיעה במסלול שאתה נוהג בו כל יום.", icon: "M3 14l2-6h14l2 6v4H3zM7 18v2M17 18v2" },
  { t: "אחריות ושירות", d: "אחריות מורחבת ל-3 שנים, טיפולים במוסכים מורשים ורכב חלופי.", icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" },
];

function Services() {
  const scope = useReveal<HTMLElement>();
  return (
    <section className="section services" ref={scope}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow" data-reveal>השירותים שלנו</p>
          <SplitReveal>הכול תחת קורת גג אחת.</SplitReveal>
        </div>
        <div className="service-grid">
          {SERVICES.map((s, i) => (
            <article className="service" key={s.t} data-reveal>
              <span className="service-num">0{i + 1}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={s.icon} /></svg>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- process */

const STEPS = [
  { t: "שיחת היכרות", d: "15 דקות בטלפון או באולם: מה אתה צריך, כמה אתה רוצה להוציא ומה חשוב לך ברכב." },
  { t: "התאמה ונסיעת מבחן", d: "אנחנו מצמצמים ל-2–3 רכבים שבאמת מתאימים, ואתה נוהג בכולם." },
  { t: "מימון ומסירה", d: "סוגרים מימון וטרייד-אין, מכינים את הרכב – ואתה מקבל מפתח לרכב מבריק." },
];

function Process() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      // the line between the steps draws itself as you scroll through the section
      gsap.fromTo(
        ".process-line i",
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".process-list", start: "top 70%", end: "bottom 60%", scrub: true } },
      );
      gsap.utils.toArray<HTMLElement>(".process-step").forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: "top 65%", onEnter: () => el.classList.add("is-on"), onLeaveBack: () => el.classList.remove("is-on") });
      });
    },
    { scope: root },
  );
  return (
    <section className="section process" ref={root}>
      <div className="container process-grid">
        <div className="process-aside">
          <p className="eyebrow">איך זה עובד</p>
          <SplitReveal>שלושה צעדים לרכב חדש.</SplitReveal>
          <Parallax speed={18} className="process-badge">
            <span>מהשיחה הראשונה<br />ועד המפתח</span>
            <b>7</b>
            <em>ימי עבודה בממוצע</em>
          </Parallax>
        </div>
        <ol className="process-list">
          <span className="process-line" aria-hidden="true"><i /></span>
          {STEPS.map((s, i) => (
            <li className="process-step" key={s.t}>
              <span className="process-dot">{i + 1}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- testimonials */

const QUOTES = [
  { q: "הגעתי עם רשימה של שלושה רכבים ויצאתי עם הרביעי – כי הקשיבו למה שאני באמת צריך. שקיפות מלאה לאורך כל הדרך.", n: "דנה כ.", c: "Noviq E1" },
  { q: "הטרייד-אין היה הוגן יותר מכל הצעה אחרת שקיבלתי, והמימון אושר תוך יומיים. ממליץ בלי לחשוב פעמיים.", n: "אבי ל.", c: "Kestrel X5" },
  { q: "הביאו לי את הרכב לנסיעת מבחן עד העבודה. שירות ברמה של מותג יוקרה.", n: "מיכל ש.", c: "Velmora S7" },
];

function Testimonials() {
  const scope = useReveal<HTMLElement>();
  return (
    <section className="section testimonials" ref={scope}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow" data-reveal>לקוחות מספרים</p>
          <SplitReveal>הנסיעה מתחילה באמון.</SplitReveal>
        </div>
        <div className="quote-grid">
          {QUOTES.map((q) => (
            <figure className="quote" key={q.n} data-reveal>
              <div className="stars" aria-label="5 כוכבים">★★★★★</div>
              <blockquote>״{q.q}״</blockquote>
              <figcaption><b>{q.n}</b><span>{q.c}</span></figcaption>
            </figure>
          ))}
        </div>
        <p className="sample-note">* המלצות לדוגמה – יוחלפו בהמלצות אמיתיות של לקוחות.</p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- contact */

function Contact() {
  const scope = useReveal<HTMLElement>();
  return (
    <section className="section contact" id="contact" ref={scope}>
      <div className="container contact-grid">
        <div>
          <p className="eyebrow" data-reveal>צור קשר</p>
          <SplitReveal>קובעים נסיעת מבחן?</SplitReveal>
          <p className="lead" data-reveal>השאירו פרטים ונחזור אליכם עוד היום. אפשר גם להתקשר או לקפוץ לאולם.</p>
          <ul className="contact-list" data-reveal>
            <li><span>טלפון</span><a href={SITE.phoneHref}>{SITE.phone}</a></li>
            <li><span>וואטסאפ</span><a href={SITE.whatsapp} target="_blank" rel="noreferrer">שלחו הודעה</a></li>
            <li><span>כתובת</span><b>{SITE.address}</b></li>
            <li><span>שעות</span><b>{SITE.hours}</b></li>
          </ul>
        </div>
        <div className="contact-card" data-reveal>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Intro />
      <Featured />
      <Services />
      <Process />
      <Testimonials />
      <Contact />
    </>
  );
}
