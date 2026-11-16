import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP);

/** Motion tokens – one personality for the whole site. */
export const EASE = {
  /** entrances: fast start, long soft landing */
  out: "expo.out",
  /** exits */
  in: "power3.in",
  /** scrubbed motion is always linear – scroll is the easing */
  scrub: "none",
} as const;

export const DUR = { fast: 0.5, base: 0.9, slow: 1.4 } as const;
export const STAGGER = { tight: 0.04, base: 0.08 } as const;

/** True when the visitor asked the OS for less motion. */
export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP };
