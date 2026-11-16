import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { gsap, reducedMotion } from "../motion/gsap";

/**
 * The page's one shape is the forward slant of speed: buttons, tags and picture frames are
 * parallelograms leaning the way the car drives (to the left, in reading direction).
 */

function useMagnet<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || reducedMotion() || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * 0.2, y: (e.clientY - (r.top + r.height / 2)) * 0.3, duration: 0.35, ease: "power3.out" });
  };
  const onPointerLeave = () => ref.current && gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
  return { ref, onPointerMove, onPointerLeave };
}

const Arrow = () => (
  <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 12H5M11 5l-7 7 7 7" />
  </svg>
);

interface ButtonProps {
  children: ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  tone?: "ink" | "accent" | "light";
  size?: "md" | "lg";
  className?: string;
}

/** The one button: a slanted block with an arrow that shoots ahead on hover. */
export function Button({ children, to, href, onClick, tone = "ink", size = "md", className = "" }: ButtonProps) {
  const m = useMagnet<HTMLAnchorElement & HTMLButtonElement>();
  const cls = `btn btn-${tone} btn-${size} ${className}`;
  const inner = (
    <>
      <span className="btn-label">{children}</span>
      <Arrow />
    </>
  );
  const common = { className: cls, ref: m.ref, onPointerMove: m.onPointerMove, onPointerLeave: m.onPointerLeave };
  if (to) return <Link to={to} {...common}>{inner}</Link>;
  if (href)
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" {...common}>
        {inner}
      </a>
    );
  return (
    <button type="button" onClick={onClick} {...common}>
      {inner}
    </button>
  );
}

/** Small slanted label. */
export function Tag({ children, tone = "soft" }: { children: ReactNode; tone?: "soft" | "accent" | "ink" }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

/** Image path inside /public/img, prefixed with the deploy base. */
export const img = (name: string) => `${import.meta.env.BASE_URL}img/${name}`;
