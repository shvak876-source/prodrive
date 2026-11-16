import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLenis } from "lenis/react";
import { CARS, CATEGORIES, carImage, formatKm, formatPrice, type Car, type Category } from "../data/cars";
import { waLink } from "../data/site";
import { MiniPlate, PlateButton } from "../components/Plate";
import { DUR, EASE, Flip, gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { SplitReveal } from "../motion/primitives";

const SORTS = { saving: "החיסכון הגדול", priceAsc: "מחיר: מהנמוך", priceDesc: "מחיר: מהגבוה", year: "הכי חדשים" } as const;
type SortKey = keyof typeof SORTS;

/** Side sheet with the inspection summary of one car. Lenis is paused so the sheet scrolls natively. */
function Sheet({ car, onClose }: { car: Car; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  useEffect(() => {
    lenis?.stop();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", key);
    ref.current?.querySelector<HTMLButtonElement>(".sheet-close")?.focus();
    return () => {
      lenis?.start();
      removeEventListener("keydown", key);
    };
  }, [lenis, onClose]);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(".sheet-backdrop", { autoAlpha: 0, duration: DUR.fast });
      gsap.from(".sheet-panel", { xPercent: -100, duration: DUR.base, ease: EASE.out });
      gsap.from(".sheet-panel > *", { y: 24, autoAlpha: 0, stagger: 0.05, duration: DUR.base, ease: EASE.out, delay: 0.12 });
    },
    { scope: ref },
  );
  const rows: [string, string][] = [
    ["שנה", String(car.year)],
    ["יד", String(car.hand)],
    ["קילומטראז׳", formatKm(car.km)],
    ["הנעה", car.fuel],
    ["סוג", car.category],
    ["צבע", car.colorName],
  ];
  return (
    <div className="sheet" ref={ref} role="dialog" aria-modal="true" aria-label={`${car.make} ${car.model}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel" data-lenis-prevent>
        <button className="sheet-close" onClick={onClose} aria-label="סגירה"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg></button>
        <div className="sheet-pic">
          <img src={carImage(car)} alt={`${car.make} ${car.model} – הדמיה`} />
        </div>
        <div>
          <MiniPlate>{car.make} · {car.year}</MiniPlate>
          <h2 style={{ marginTop: 14 }}>{car.model}</h2>
          <div className="sheet-prices">
            <div>
              <span className="deal-label">המוכר ביקש</span>
              <s className="deal-asked">{formatPrice(car.asked)}</s>
            </div>
            <div>
              <span className="deal-label">מחיר היעד שלנו</span>
              <b className="odo">{formatPrice(car.target)}</b>
            </div>
          </div>
        </div>
        <p className="lead">מהבדיקה: {car.note}.</p>
        <dl className="spec-list">
          {rows.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <PlateButton href={waLink(`היי, מעניין אותי ה-${car.make} ${car.model} (${car.year}) מהאתר`)} size="lg">
          אני רוצה את הרכב הזה
        </PlateButton>
        <p className="note">נתונים לדוגמה; התמונה היא הדמיה.</p>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<Category | "הכול">("הכול");
  const [sort, setSort] = useState<SortKey>("saving");
  const [max, setMax] = useState(500000);
  const grid = useRef<HTMLDivElement>(null);
  const flip = useRef<Flip.FlipState | null>(null);
  const open = CARS.find((c) => c.id === params.get("car")) ?? null;
  const setOpen = (c: Car | null) => setParams(c ? { car: c.id } : {}, { replace: true, preventScrollReset: true });

  const list = useMemo(() => {
    const out = CARS.filter((c) => (cat === "הכול" || c.category === cat) && c.target <= max);
    if (sort === "saving") out.sort((a, b) => b.asked - b.target - (a.asked - a.target));
    if (sort === "priceAsc") out.sort((a, b) => a.target - b.target);
    if (sort === "priceDesc") out.sort((a, b) => b.target - a.target);
    if (sort === "year") out.sort((a, b) => b.year - a.year);
    return out;
  }, [cat, sort, max]);

  const change = <T,>(fn: (v: T) => void) => (v: T) => {
    if (grid.current && !reducedMotion()) flip.current = Flip.getState(grid.current.querySelectorAll(".cat-card"));
    fn(v);
  };

  useGSAP(
    () => {
      const s = flip.current;
      if (!s) {
        if (!reducedMotion()) gsap.from(".cat-card", { y: 50, autoAlpha: 0, stagger: 0.06, duration: DUR.base, ease: EASE.out, delay: 0.2 });
        return;
      }
      flip.current = null;
      Flip.from(s, {
        duration: 0.7,
        ease: "power3.inOut",
        absolute: true,
        onEnter: (e) => gsap.fromTo(e, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.5 }),
        onLeave: (e) => gsap.to(e, { autoAlpha: 0, scale: 0.9, duration: 0.3 }),
      });
    },
    { scope: grid, dependencies: [list], revertOnUpdate: false },
  );

  return (
    <div>
      <section className="page-head">
        <SplitReveal as="h1" immediate>רכבים שבדקתי.</SplitReveal>
        <p className="lead">כל רכב כאן עבר היסטוריה, מכון ובדיקת מחיר. לצד כל אחד: מה המוכר ביקש, ומה מחיר היעד שלנו במשא ומתן.</p>
      </section>
      <section className="wrap" style={{ paddingBottom: "var(--gap-section)" }} aria-label="רשימת רכבים">
        <div className="filters" role="search">
          {(["הכול", ...CATEGORIES] as const).map((c) => (
            <button key={c} className={`chip ${cat === c ? "is-on" : ""}`} aria-pressed={cat === c} onClick={() => change(setCat)(c)}>
              {c}
            </button>
          ))}
          <div className="filter-fields">
            <label className="field">
              <span>מיון</span>
              <select value={sort} onChange={(e) => change(setSort)(e.target.value as SortKey)}>
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>תקציב עד {formatPrice(max)}</span>
              <input type="range" min={80000} max={500000} step={10000} value={max} onChange={(e) => change(setMax)(Number(e.target.value))} />
            </label>
          </div>
        </div>
        <p className="result-count" aria-live="polite">{list.length} רכבים</p>
        <div className="cat-grid" ref={grid}>
          {list.map((c) => (
            <button className="cat-card" key={c.id} data-flip-id={c.id} onClick={() => setOpen(c)} aria-label={`${c.make} ${c.model}, ${c.year}`}>
              <span className="cat-tag"><MiniPlate>חוסכים {formatPrice(c.asked - c.target)}</MiniPlate></span>
              <span className="cat-pic"><img src={carImage(c)} alt="" loading="lazy" /></span>
              <span className="cat-body">
                <span className="cat-top">
                  <h3>{c.make} {c.model}</h3>
                  <span>{c.year}</span>
                </span>
                <span className="meta">יד {c.hand} · {formatKm(c.km)} · {c.fuel}</span>
                <span className="cat-price">
                  <s>{formatPrice(c.asked)}</s>
                  <b>{formatPrice(c.target)}</b>
                </span>
              </span>
            </button>
          ))}
          {list.length === 0 && <p className="lead">אין רכב בתקציב הזה כרגע – ספרו לי מה אתם מחפשים ואאתר בשבילכם.</p>}
        </div>
        <p className="note">קטלוג לדוגמה: הדגמים, המספרים והמחירים להמחשה, והתמונות הן הדמיה של אותו מודל תלת-ממד.</p>
      </section>
      {open && <Sheet car={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
