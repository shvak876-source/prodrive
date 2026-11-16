import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { gsap, reducedMotion } from "../motion/gsap";

/**
 * The page's one motif: the Israeli license plate. A yellow field with the blue "IL" strip at its
 * left end. Used as the button, the image frame, the bullet and the giant hero shape.
 */

/** Small magnetic pull toward the pointer – the button leans in before you click it. */
function useMagnet<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || reducedMotion() || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.18;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.28;
    gsap.to(el, { x, y, duration: 0.4, ease: "power3.out" });
  };
  const onLeave = () => ref.current && gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" });
  return { ref, onPointerMove: onMove, onPointerLeave: onLeave };
}

interface PlateButtonProps {
  children: ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  size?: "md" | "lg";
  tone?: "yellow" | "ink";
  className?: string;
}

/** Primary action shaped like a plate. Renders a router Link, an anchor or a button. */
export function PlateButton({ children, to, href, onClick, size = "md", tone = "yellow", className = "" }: PlateButtonProps) {
  const m = useMagnet<HTMLAnchorElement & HTMLButtonElement>();
  const cls = `plate-btn plate-btn-${size} plate-btn-${tone} ${className}`;
  const inner = (
    <>
      <span className="plate-strip" aria-hidden="true">IL</span>
      <span className="plate-label">{children}</span>
    </>
  );
  if (to)
    return (
      <Link to={to} className={cls} ref={m.ref} onPointerMove={m.onPointerMove} onPointerLeave={m.onPointerLeave}>
        {inner}
      </Link>
    );
  if (href)
    return (
      <a href={href} className={cls} ref={m.ref} onPointerMove={m.onPointerMove} onPointerLeave={m.onPointerLeave} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
        {inner}
      </a>
    );
  return (
    <button type="button" className={cls} onClick={onClick} ref={m.ref} onPointerMove={m.onPointerMove} onPointerLeave={m.onPointerLeave}>
      {inner}
    </button>
  );
}

/** A picture framed as a plate: same corner, the blue strip down its left edge. */
export function PlateFrame({ src, alt, className = "", children }: { src: string; alt: string; className?: string; children?: ReactNode }) {
  return (
    <figure className={`plate-frame ${className}`}>
      <img src={src} alt={alt} loading="lazy" />
      <span className="plate-frame-strip" aria-hidden="true" />
      {children}
    </figure>
  );
}

/** Inline mini plate used as a list bullet or as a number badge. */
export function MiniPlate({ children }: { children: ReactNode }) {
  return (
    <span className="mini-plate">
      <i aria-hidden="true" />
      <b>{children}</b>
    </span>
  );
}

/** Image path inside /public, prefixed with the deploy base. */
export const img = (name: string) => `${import.meta.env.BASE_URL}img/${name}`;
