import { useRef, type ElementType, type ReactNode } from "react";
import { DUR, EASE, STAGGER, ScrollTrigger, SplitText, gsap, reducedMotion, useGSAP } from "./gsap";

interface SplitRevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** seconds before the reveal starts */
  delay?: number;
  /** play on mount instead of on scroll into view (above-the-fold headlines) */
  immediate?: boolean;
}

/**
 * Headline that rises word-by-word out of line masks. Words, not chars: Hebrew reads as
 * whole words and per-char splitting would add hundreds of nodes for no visible gain.
 */
export function SplitReveal({ children, as: Tag = "h2", className, delay = 0, immediate = false }: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reducedMotion()) return;
      let split: SplitText | undefined;
      // split only after webfonts load, otherwise the line breaks are measured with the fallback font
      document.fonts.ready.then(() => {
        split = SplitText.create(el, {
          type: "lines,words",
          mask: "lines",
          autoSplit: true,
          aria: "auto",
          onSplit(self) {
            gsap.set(el, { autoAlpha: 1 });
            return gsap.from(self.words, {
              yPercent: 110,
              duration: DUR.slow,
              ease: EASE.out,
              stagger: STAGGER.base, // 80ms between words
              delay,
              scrollTrigger: immediate ? undefined : { trigger: el, start: "top 85%", once: true },
            });
          },
        });
      });
      return () => split?.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className} style={reducedMotion() ? undefined : { visibility: "hidden" }}>
      {children}
    </Tag>
  );
}

/**
 * Fades + lifts every `[data-reveal]` descendant as it enters the viewport, batched so
 * neighbours entering together stagger instead of popping at once.
 */
export function useReveal<T extends HTMLElement>() {
  const scope = useRef<T>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      gsap.set(items, { autoAlpha: 0, y: 40 });
      // batch groups elements entering in the same tick so they stagger together
      ScrollTrigger.batch(items, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: DUR.base, ease: EASE.out, stagger: STAGGER.base, overwrite: true }),
      });
    },
    { scope },
  );
  return scope;
}

/** Moves children at a fraction of scroll speed (transform only). Positive speed recedes. */
export function Parallax({ children, speed = 15, className }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.fromTo(
        ref.current,
        { yPercent: -speed / 2 },
        {
          yPercent: speed / 2,
          ease: EASE.scrub,
          scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    },
    { scope: ref, dependencies: [speed] },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
