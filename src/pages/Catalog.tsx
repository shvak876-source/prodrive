import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLenis } from "lenis/react";
import { CARS, formatKm, formatPrice, type Car } from "../data/cars";
import { CarCard } from "../components/CarCard";
import { ContactForm } from "../components/ContactForm";
import { DUR, EASE, Flip, gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { SplitReveal } from "../motion/primitives";

const CATEGORIES = ["הכול", "סדאן", "SUV", "קופה", "חשמלי"] as const;
const CONDITIONS = ["הכול", "חדש", "0 ק״מ", "משומש"] as const;
const SORTS = { featured: "מומלצים", priceAsc: "מחיר: מהנמוך", priceDesc: "מחיר: מהגבוה", hp: "הכי חזקים" } as const;
type SortKey = keyof typeof SORTS;

/** Slide-over detail sheet for one car. Native scroll inside (Lenis opted out). */
function CarSheet({ car, onClose }: { car: Car; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  useEffect(() => {
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLButtonElement>(".sheet-close")?.focus();
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [lenis, onClose]);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(".sheet-backdrop", { autoAlpha: 0, duration: DUR.fast });
      gsap.from(".sheet-panel", { xPercent: -100, duration: DUR.base, ease: EASE.out });
      gsap.from(".sheet-panel > *", { y: 30, autoAlpha: 0, stagger: 0.06, duration: DUR.base, ease: EASE.out, delay: 0.15 });
    },
    { scope: ref },
  );
  const rows: [string, string][] = [
    ["שנת ייצור", String(car.year)],
    ["סוג", car.category],
    ["מצב", car.condition],
    ["קילומטראז׳", formatKm(car.km)],
    ["הנעה", car.fuel],
    ["תיבת הילוכים", car.gearbox],
    ["כוח", `${car.hp} כ״ס`],
    ["0–100 קמ״ש", `${car.accel} שניות`],
    ["צבע", car.colorName],
  ];
  const monthly = Math.round((car.price * 0.8 * (0.055 / 12)) / (1 - Math.pow(1 + 0.055 / 12, -60)));
  return (
    <div className="sheet" ref={ref} role="dialog" aria-modal="true" aria-label={`${car.make} ${car.model}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel" data-lenis-prevent>
        <button className="sheet-close" onClick={onClose} aria-label="סגירה">✕</button>
        <div className="sheet-media" style={{ ["--tint" as string]: car.color }}>
          <img src={car.image} alt={`${car.make} ${car.model}`} />
        </div>
        <div className="sheet-head">
          <span className="eyebrow-sm">{car.make} · {car.year} · {car.condition}</span>
          <h2>{car.model}</h2>
          <div className="sheet-price">
            <b>{formatPrice(car.price)}</b>
            <span>או החל מ-{formatPrice(monthly)} לחודש*</span>
          </div>
        </div>
        <dl className="spec-table">
          {rows.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <ul className="highlights">
          {car.highlights.map((h) => <li key={h}>{h}</li>)}
        </ul>
        <div className="sheet-form">
          <h3>מעוניינים ב-{car.model}?</h3>
          <ContactForm defaultModel={car.id} compact />
        </div>
        <p className="form-note">* הדמיה: 20% מקדמה, 60 תשלומים, ריבית 5.5%. כפוף לאישור גוף המימון.</p>
      </div>
    </div>
  );
}

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("הכול");
  const [cond, setCond] = useState<(typeof CONDITIONS)[number]>("הכול");
  const [sort, setSort] = useState<SortKey>("featured");
  const [maxPrice, setMaxPrice] = useState(600000);
  const [q, setQ] = useState("");
  const grid = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const open = CARS.find((c) => c.id === params.get("car")) ?? null;
  const setOpen = (c: Car | null) => setParams(c ? { car: c.id } : {}, { replace: true, preventScrollReset: true });

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = CARS.filter(
      (c) =>
        (cat === "הכול" || c.category === cat) &&
        (cond === "הכול" || c.condition === cond) &&
        c.price <= maxPrice &&
        (!term || `${c.make} ${c.model} ${c.colorName} ${c.fuel}`.toLowerCase().includes(term)),
    );
    if (sort === "priceAsc") out.sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") out.sort((a, b) => b.price - a.price);
    if (sort === "hp") out.sort((a, b) => b.hp - a.hp);
    return out;
  }, [cat, cond, sort, maxPrice, q]);

  /** Capture card positions before a filter change so Flip can animate the re-layout. */
  const change = <T,>(fn: (v: T) => void) => (v: T) => {
    if (grid.current && !reducedMotion()) flipState.current = Flip.getState(grid.current.querySelectorAll(".car-card"));
    fn(v);
  };

  useGSAP(
    () => {
      const state = flipState.current;
      if (!state) {
        // first paint: cards rise in sequence
        if (!reducedMotion())
          gsap.from(".car-card", { y: 50, autoAlpha: 0, duration: DUR.base, ease: EASE.out, stagger: 0.06, delay: 0.2 });
        return;
      }
      flipState.current = null;
      Flip.from(state, {
        duration: 0.7,
        ease: "power3.inOut",
        absolute: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.5 }),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.92, duration: 0.35 }),
      });
    },
    { scope: grid, dependencies: [list], revertOnUpdate: false },
  );

  return (
    <div className="catalog-page">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">קטלוג רכבים</p>
          <SplitReveal as="h1" className="display" immediate>
            מצאו את הרכב שלכם.
          </SplitReveal>
          <p className="lead">{CARS.length} רכבים באולם עכשיו. כל רכב נבדק, מתועד ומוכן לנסיעת מבחן.</p>
          <p className="sample-note">* קטלוג לדוגמה – הדגמים והמחירים להמחשה בלבד.</p>
        </div>
      </section>

      <section className="container catalog">
        <div className="filters" role="search">
          <div className="chips" role="group" aria-label="סוג רכב">
            {CATEGORIES.map((c) => (
              <button key={c} className={`chip ${cat === c ? "is-on" : ""}`} aria-pressed={cat === c} onClick={() => change(setCat)(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="filter-row">
            <label className="field">
              <span>חיפוש</span>
              <input value={q} onChange={(e) => change(setQ)(e.target.value)} placeholder="יצרן, דגם, צבע..." />
            </label>
            <label className="field">
              <span>מצב</span>
              <select value={cond} onChange={(e) => change(setCond)(e.target.value as typeof cond)}>
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="field">
              <span>מיון</span>
              <select value={sort} onChange={(e) => change(setSort)(e.target.value as SortKey)}>
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="field field-range">
              <span>מחיר עד <b>{formatPrice(maxPrice)}</b></span>
              <input type="range" min={150000} max={600000} step={10000} value={maxPrice} onChange={(e) => change(setMaxPrice)(Number(e.target.value))} />
            </label>
          </div>
          <p className="result-count" aria-live="polite">{list.length} רכבים נמצאו</p>
        </div>

        <div className="car-grid" ref={grid}>
          {list.map((c) => (
            <CarCard key={c.id} car={c} onOpen={setOpen} />
          ))}
          {list.length === 0 && (
            <div className="empty">
              <h3>לא מצאנו רכב שמתאים לסינון</h3>
              <p className="muted">נסו להרחיב את טווח המחיר, או השאירו פרטים ונאתר בשבילכם את הרכב.</p>
            </div>
          )}
        </div>
      </section>

      {open && <CarSheet car={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
