import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CARS, CATEGORIES, carImage, formatKm, formatPrice, type Category } from "../data/cars";
import { FAQ, FOUNDER, PACKAGES, SITE, waLink } from "../data/site";
import { MiniPlate, PlateButton, img } from "../components/Plate";
import { Odometer, type OdometerHandle } from "../components/Odometer";
import { PAINTS, type PaintId } from "../three/RealCar";
import { STORY_START, story } from "../three/storyState";
import { DUR, EASE, Flip, ScrollTrigger, gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { SplitReveal } from "../motion/primitives";

const CarStage = lazy(() => import("../three/CarStage"));

/* ======================================================================= story */

const ACTS = [
  { id: "search", word: "מחפשים", text: "סורקים מאות מודעות, סוכנויות וחברות ליסינג. אתה מקבל שלושה רכבים שבאמת מתאימים – לא שלושים." },
  { id: "inspect", word: "בודקים", text: "פותחים כל דלת: היסטוריית ביטוח ותאונות, קילומטראז׳ מול רשומות טסט ובדיקה במכון מורשה." },
  { id: "deal", word: "מתמקחים", text: "מגיעים למוכר עם נתונים ולא עם תחושות – ואתה לא צריך להתווכח עם אף אחד." },
  { id: "keys", word: "מוסרים", text: "מימון, ביטוח והעברת בעלות – והרכב מחכה לך בחניה עם מפתח." },
];
const ASKED = 249000;
const CLOSED = 231500;

/**
 * Hero + pinned scroll story in one section. The car stage holds still while ~4 screens of scroll
 * play the brokerage as a performance:
 *   search  – the car turns a full circle (we look at it from every side)
 *   inspect – scissor doors and the front clamshell open, camera moves in
 *   deal    – doors close, side profile, the price odometer rolls from asked to closed
 *   keys    – lights on, the car drives out of frame
 */
function Story() {
  const root = useRef<HTMLElement>(null);
  const odo = useRef<OdometerHandle>(null);
  const [paint, setPaint] = useState<PaintId>("carmine");
  const [act, setAct] = useState(-1);

  useGSAP(
    () => {
      Object.assign(story, STORY_START);
      const rm = reducedMotion();
      // entrance: plate slides up, car drops onto it
      if (!rm) {
        gsap.from(".giant-plate", { yPercent: 40, autoAlpha: 0, duration: 1.4, ease: EASE.out, delay: 0.1 });
        gsap.fromTo(story, { lift: 1.6, yaw: STORY_START.yaw + 1.2 }, { lift: 0, yaw: STORY_START.yaw, duration: 1.8, ease: "expo.out", delay: 0.35 });
        gsap.from(".hero-act .lead, .hero-act .hero-actions, .swatches", { y: 24, autoAlpha: 0, duration: DUR.base, ease: EASE.out, stagger: 0.08, delay: 0.6 });
      }
      if (rm) {
        story.yaw = -0.9;
        return;
      }

      const mm = gsap.matchMedia();
      mm.add("(min-width: 0px)", () => {
        const val = { price: ASKED };
        const tl = gsap.timeline({
          defaults: { ease: EASE.scrub },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=360%",
            pin: true,
            scrub: true,
            anticipatePin: 1,
            onUpdate: (st) => {
              // which act is on screen (hero = -1), for the act plates
              const p = st.progress;
              setAct(p < 0.12 ? -1 : p < 0.36 ? 0 : p < 0.58 ? 1 : p < 0.8 ? 2 : 3);
            },
          },
        });
        // hero copy leaves
        tl.to(".hero-act", { autoAlpha: 0, y: -60, duration: 0.6 }, 0.4)
          // SEARCH: one full turn and a bit, ending three-quarter front
          .to(story, { yaw: STORY_START.yaw - Math.PI * 2, duration: 2.4, ease: "sine.inOut" }, 0.3)
          .fromTo(".act-search", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.9)
          .to(".act-search", { autoAlpha: 0, y: -60, duration: 0.5 }, 2.6)
          // INSPECT: doors up, clamshell up, move in
          .to(story, { doors: 1, hood: 1, zoom: 1, yaw: STORY_START.yaw - Math.PI * 2 + 0.25, duration: 1.6, ease: "power2.inOut" }, 2.8)
          .fromTo(".act-inspect", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 3.0)
          .to(".act-inspect", { autoAlpha: 0, y: -60, duration: 0.5 }, 4.6)
          // DEAL: close up, side profile, price rolls down
          .to(story, { doors: 0, hood: 0, zoom: 0.3, yaw: -Math.PI / 2 - Math.PI * 2, duration: 1.3, ease: "power2.inOut" }, 4.7)
          .fromTo(".act-deal", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 4.9)
          .to(val, { price: CLOSED, duration: 1.4, ease: "power1.inOut", onUpdate: () => odo.current?.set(val.price) }, 5.3)
          .to(".act-deal", { autoAlpha: 0, y: -60, duration: 0.5 }, 6.9)
          // KEYS: lights on, nose toward the exit, drive out
          .to(story, { lights: 1, zoom: 0, yaw: -Math.PI / 2 - Math.PI * 2 - 0.35, duration: 0.8 }, 7.0)
          .fromTo(".act-keys", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 7.2)
          .to(story, { drive: 16, duration: 1.8, ease: "power2.in" }, 7.9)
          .to(".giant-plate", { yPercent: -18, duration: 9.7, ease: "none" }, 0)
          .to(".story-progress i", { scaleX: 1, duration: 9.7, ease: "none" }, 0);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section className="story" ref={root} aria-label="Pro Drive – תיווך רכב">
      <div className="story-stage">
        <div className="giant-plate" aria-hidden="true">
          <span className="giant-plate-strip">IL</span>
          <span className="giant-plate-text">
            <svg viewBox="0 0 1000 200" role="presentation">
              <text x="0" y="160" fontSize="196">PRO·DRIVE</text>
            </svg>
          </span>
        </div>
        <Suspense fallback={<div className="stage-canvas" />}>
          <CarStage paint={paint} />
        </Suspense>
      </div>

      <div className="story-copy">
        <div className="act hero-act">
          <SplitReveal as="h1" className="display" immediate>
            מתווך רכב שעובד בשבילך.
          </SplitReveal>
          <p className="lead">אני מאתר, בודק ומתמקח על הרכב הבא שלך – מול סוכנויות, ליסינג ויד שנייה. אתה מגיע רק לקחת מפתח.</p>
          <div className="hero-actions">
            <PlateButton href={waLink("היי, אני מחפש רכב ואשמח לשיחה")} size="lg">
              ספרו לי מה אתם מחפשים
            </PlateButton>
            <a className="text-link" href="#how">איך זה עובד</a>
          </div>
          <div className="swatches" role="radiogroup" aria-label="צבע הרכב">
            <span>צבע:</span>
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

        {ACTS.map((a) => (
          <div className={`act act-${a.id}`} key={a.id}>
            <h2 className="act-word">{a.word}</h2>
            {a.id === "deal" && (
              <div className="deal">
                <div>
                  <span className="deal-label">המחיר המבוקש</span>
                  <s className="deal-asked">{formatPrice(ASKED)}</s>
                </div>
                <div>
                  <span className="deal-label">המחיר שסגרנו (דוגמה)</span>
                  <Odometer ref={odo} digits={6} initial={ASKED} prefix="₪" label="המחיר שסגרנו" />
                </div>
              </div>
            )}
            <p className="lead">{a.text}</p>
          </div>
        ))}

        <ol className="act-plates" aria-label="שלבי העבודה">
          {ACTS.map((a, i) => (
            <li key={a.id} className={act === i ? "is-on" : act > i ? "is-done" : ""}>
              <MiniPlate>{a.word}</MiniPlate>
            </li>
          ))}
        </ol>
      </div>
      <div className="story-progress" aria-hidden="true"><i /></div>
    </section>
  );
}

/* ====================================================================== plates band */

const PLATE_NUMBERS = ["12-345-67", "803-41-902", "55-218-36", "271-08-114", "96-512-04", "418-26-337", "30-777-81", "624-90-215", "71-403-58", "189-62-740"];

/** Full-width yellow band of plates sliding sideways; scroll speed skews and speeds it up. */
function PlatesBand() {
  const track = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (reducedMotion() || !track.current) return;
    // the row holds the list twice: sliding it by half its width loops seamlessly (left → right)
    const loop = gsap.fromTo(track.current, { xPercent: -50 }, { xPercent: 0, duration: 30, ease: "none", repeat: -1 });
    const skew = gsap.quickTo(track.current, "skewX", { duration: 0.5, ease: "power3.out" });
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-12, 12, self.getVelocity() / 260);
        skew(-v);
        loop.timeScale(1 + Math.abs(v) * 0.6);
      },
    });
    return () => {
      loop.kill();
      st.kill();
    };
  });
  const row = [...PLATE_NUMBERS, ...PLATE_NUMBERS];
  return (
    <div className="plates-band" aria-hidden="true">
      <div className="plates-track" ref={track}>
        {row.map((n, i) => (
          <span className="band-plate" key={i}>
            <i>IL</i>
            <b>{n}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ====================================================================== statement */

function Statement() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(".thumb", {
        scale: 0,
        rotate: -12,
        duration: 0.9,
        ease: "back.out(1.7)",
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
      });
    },
    { scope: root },
  );
  const T = ({ src, alt }: { src: string; alt: string }) => (
    <span className="thumb">
      <img src={img(src)} alt={alt} loading="lazy" />
    </span>
  );
  return (
    <section className="statement-sec" ref={root} id="how">
      <h2 className="sr-only">מה זה תיווך רכב</h2>
      <p className="statement">
        אני לא מוכר רכבים <T src="d-wheel.webp" alt="גלגל וצלחת בלם" />. אני קונה אותם בשבילך <T src="d-seat.webp" alt="מושבים מבעד לדלת פתוחה" />, בודק כל פרט <T src="d-light.webp" alt="פנס קדמי דולק" /> ומביא אותך עד הלוחית <T src="d-plate.webp" alt="לוחית רישוי צהובה" /> החדשה.
      </p>
    </section>
  );
}

/* ====================================================================== packages */

/** Order carried by size: three tiles, each taller than the last, growing in as they enter. */
function Packages() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(".tile", {
        scaleY: 0.15,
        transformOrigin: "bottom",
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".tiles", start: "top 75%", once: true },
      });
      gsap.from(".tile img", {
        y: 60,
        autoAlpha: 0,
        duration: 1.2,
        ease: EASE.out,
        stagger: 0.12,
        delay: 0.3,
        scrollTrigger: { trigger: ".tiles", start: "top 75%", once: true },
      });
      gsap.from(".tile-text", { y: 24, autoAlpha: 0, stagger: 0.09, duration: DUR.base, ease: EASE.out, scrollTrigger: { trigger: ".tile-texts", start: "top 85%", once: true } });
    },
    { scope: root },
  );
  return (
    <section className="packages section" ref={root} aria-labelledby="pk-h">
      <div className="wrap packages-grid">
        <h2 id="pk-h" className="packages-h">שלוש חבילות, מחיר אחד ידוע מראש.</h2>
        <div className="tiles">
          {PACKAGES.map((p, i) => (
            <div className={`tile tile-${i}`} key={p.id}>
              <img src={img(p.image)} alt="" loading="lazy" />
            </div>
          ))}
        </div>
        <div className="tile-texts">
          {PACKAGES.map((p, i) => (
            <div className={`tile-text tile-text-${i}`} key={p.id}>
              <h3>{p.name}</h3>
              <p className="tile-price">{formatPrice(p.price)}</p>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
        <p className="note">מחירים לדוגמה, כולל מע״מ.</p>
      </div>
    </section>
  );
}

/* ====================================================================== report showcase */

const REPORT = [
  { id: "history", tab: "היסטוריה", title: "כל מה שקרה לרכב.", text: "בעלויות קודמות, תביעות ביטוח, שמאויות וריקולים פתוחים – מול המאגרים הרשמיים, לפני שמישהו נוסע לראות אותו.", image: "d-plate.webp" },
  { id: "garage", tab: "מכון בדיקה", title: "בדיקה מלאה במכון.", text: "מנוע, גיר, שלדה, בלמים וצמיגים. דו״ח כתוב עם תמונות, ואני עובר עליו איתך שורה אחרי שורה.", image: "d-wheel.webp" },
  { id: "cabin", tab: "תא הנוסעים", title: "מבפנים, לא רק מבחוץ.", text: "מערכות, מושבים, מזגן ומולטימדיה – הדברים שמגלים רק אחרי חודש של נסיעה, נבדקים ביום הראשון.", image: "d-seat.webp" },
];

/** The live report: tabs swap the square picture with a slow crossfade (the page's signature move). */
function Report() {
  const [i, setI] = useState(0);
  const root = useRef<HTMLElement>(null);
  const paused = useRef(false);
  useEffect(() => {
    if (reducedMotion()) return;
    const id = window.setInterval(() => {
      if (!paused.current && !document.hidden) setI((n) => (n + 1) % REPORT.length);
    }, 5600);
    return () => window.clearInterval(id);
  }, []);
  const r = REPORT[i];
  return (
    <section className="report" ref={root} aria-labelledby="rep-h" onPointerEnter={() => (paused.current = true)} onPointerLeave={() => (paused.current = false)}>
      <div className="report-pic">
        {REPORT.map((x, k) => (
          <img key={x.id} src={img(x.image)} alt={k === i ? x.title : ""} className={k === i ? "is-on" : ""} loading="lazy" />
        ))}
        <span className="report-stamp">נבדק</span>
      </div>
      <div className="report-body">
        <div className="tabs" role="tablist" aria-label="חלקי הדו״ח">
          {REPORT.map((x, k) => (
            <button key={x.id} role="tab" aria-selected={k === i} className={k === i ? "is-on" : ""} onClick={() => setI(k)}>
              {x.tab}
            </button>
          ))}
        </div>
        <div className="report-text" role="tabpanel">
          <h2 id="rep-h">{r.title}</h2>
          <p>{r.text}</p>
        </div>
        <div className="cells">
          <a className="cell cell-ink" href={waLink("אשמח לקבל דו״ח בדיקה לדוגמה")} target="_blank" rel="noreferrer">
            דו״ח לדוגמה בוואטסאפ
          </a>
          <Link className="cell cell-soft" to="/catalog">
            רכבים שנבדקו
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ====================================================================== market list */

/** Category tabs + banded rows of checked cars; Flip animates the rows when the tab changes. */
function Market() {
  const [cat, setCat] = useState<Category>("משפחתי");
  const list = useRef<HTMLDivElement>(null);
  const flip = useRef<Flip.FlipState | null>(null);
  const rows = CARS.filter((c) => c.category === cat).slice(0, 4);
  const choose = (c: Category) => {
    if (list.current && !reducedMotion()) flip.current = Flip.getState(list.current.children);
    setCat(c);
  };
  useGSAP(
    () => {
      if (!flip.current) {
        if (!reducedMotion())
          gsap.from(".band", { y: 30, autoAlpha: 0, stagger: 0.07, duration: DUR.base, ease: EASE.out, scrollTrigger: { trigger: list.current, start: "top 85%", once: true } });
        return;
      }
      const s = flip.current;
      flip.current = null;
      Flip.from(s, { duration: 0.6, ease: "power3.inOut", absolute: true, onEnter: (e) => gsap.fromTo(e, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.05 }), onLeave: (e) => gsap.to(e, { autoAlpha: 0, duration: 0.25 }) });
    },
    { scope: list, dependencies: [cat], revertOnUpdate: false },
  );
  return (
    <section className="market section" aria-labelledby="mk-h">
      <div className="wrap">
        <div className="market-head">
          <h2 id="mk-h">
            <span className="soft">עכשיו בשוק,</span>
            <br />
            רכבים שבדקתי השבוע.
          </h2>
          <PlateButton to="/catalog">לכל הרכבים</PlateButton>
        </div>
        <div className="market-body">
          <div className="day-tabs" role="tablist" aria-label="סוג רכב">
            {CATEGORIES.map((c) => (
              <button key={c} role="tab" aria-selected={c === cat} className={c === cat ? "is-on" : ""} onClick={() => choose(c)}>
                <b>{c}</b>
                <span>{CARS.filter((x) => x.category === c).length} רכבים</span>
              </button>
            ))}
          </div>
          <div className="bands" ref={list}>
            {rows.map((c) => (
              <Link to={`/catalog?car=${c.id}`} className="band" key={c.id} data-flip-id={c.id}>
                <span className="band-year">{c.year}</span>
                <span className="band-title">
                  <b>{c.make} {c.model}</b>
                  <small>{c.note}</small>
                </span>
                <span className="band-meta">יד {c.hand} · {formatKm(c.km)}</span>
                <span className="band-price">
                  <s>{formatPrice(c.asked)}</s>
                  <b>{formatPrice(c.target)}</b>
                </span>
                <img className="band-pic" src={carImage(c)} alt="" loading="lazy" />
              </Link>
            ))}
          </div>
        </div>
        <p className="note">רכבים ומחירים לדוגמה; התמונות הן הדמיה.</p>
      </div>
    </section>
  );
}

/* ====================================================================== about */

function About() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.fromTo(".about-shape", { yPercent: 20, rotate: -6 }, { yPercent: -8, rotate: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from(".about-block", { y: 30, autoAlpha: 0, stagger: 0.1, duration: DUR.base, ease: EASE.out, scrollTrigger: { trigger: root.current, start: "top 65%", once: true } });
    },
    { scope: root },
  );
  return (
    <section className="about-panel" ref={root} aria-labelledby="ab-h">
      <div className="about-left">
        <h2 id="ab-h">מאחורי כל עסקה יש בן אדם.</h2>
        <div className="about-shape">
          <img src={img(FOUNDER.photo || "d-seat.webp")} alt={FOUNDER.photo ? FOUNDER.name : "תא נהג מבעד לדלת פתוחה"} loading="lazy" />
          <span className="about-shape-strip" aria-hidden="true" />
        </div>
      </div>
      <div className="about-right">
        <div className="about-block">
          <h3>{FOUNDER.name}</h3>
          <p>{FOUNDER.intro[0]} {FOUNDER.intro[1].split(".")[0]}.</p>
        </div>
        <div className="about-block">
          <h3>למה עברתי צד</h3>
          <p>אין לי עמלות ממוכרים, אז ההמלצה שלי לא תלויה במי שמוכר. כל לקוח מקבל את הטלפון האישי שלי – מהשיחה הראשונה ועד אחרי המסירה.</p>
        </div>
        <PlateButton to="/about">הסיפור המלא</PlateButton>
      </div>
    </section>
  );
}

/* ====================================================================== faq */

function Faq() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(".qa", { y: 30, autoAlpha: 0, stagger: 0.06, duration: DUR.base, ease: EASE.out, scrollTrigger: { trigger: ".qas", start: "top 80%", once: true } });
    },
    { scope: root },
  );
  return (
    <section className="faq section" ref={root} aria-labelledby="faq-h" id="faq">
      <div className="wrap faq-grid">
        <h2 id="faq-h" className="faq-h">שאלות שכולם שואלים.</h2>
        <div className="qas">
          {FAQ.map((f, i) => (
            <details className="qa" key={f.q} name="faq" open={i === 0}>
              <summary>
                <span>{f.q}</span>
                <i aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ====================================================================== cta */

/** The whole band is one link, shaped as a giant plate. The word follows the pointer a little. */
function Cta() {
  const word = useRef<HTMLSpanElement>(null);
  const move = (e: React.PointerEvent) => {
    if (reducedMotion() || !word.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    gsap.to(word.current, { x: ((e.clientX - r.left) / r.width - 0.5) * 40, y: ((e.clientY - r.top) / r.height - 0.5) * 20, duration: 0.8, ease: "power3.out" });
  };
  return (
    <section className="cta-sec" aria-label="יצירת קשר" id="contact">
      <a className="cta-band" href={waLink("היי, אני מחפש רכב ואשמח לשיחה")} target="_blank" rel="noreferrer" onPointerMove={move}>
        <span className="cta-strip" aria-hidden="true">IL</span>
        <span className="cta-note">שיחה של עשר דקות בוואטסאפ, ואני יוצא לחפש.</span>
        <svg className="cta-arrow" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M38 10 L10 38 M38 10 H16 M38 10 V32" />
        </svg>
        <span className="cta-word" ref={word}>מתחילים</span>
      </a>
      <div className="wrap cta-alt">
        <span>מעדיפים טלפון?</span>
        <a href={SITE.phoneHref} dir="ltr">{SITE.phone}</a>
        <span>{SITE.hours}</span>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <Story />
      <PlatesBand />
      <Statement />
      <Packages />
      <Report />
      <Market />
      <About />
      <Faq />
      <Cta />
    </>
  );
}
