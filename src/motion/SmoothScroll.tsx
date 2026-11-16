import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { gsap, ScrollTrigger, reducedMotion } from "./gsap";
import "lenis/dist/lenis.css";

/** Resets scroll and re-measures every trigger after each route change. */
function RouteSync() {
  const { pathname, hash } = useLocation();
  const lenis = useLenis();
  useEffect(() => {
    if (hash) {
      // wait for the new page to mount before jumping to the anchor
      const id = window.setTimeout(() => lenis?.scrollTo(hash, { offset: -80 }), 120);
      return () => window.clearTimeout(id);
    }
    lenis?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 60);
    return () => window.clearTimeout(id);
  }, [pathname, hash, lenis]);
  return null;
}

/**
 * App-wide smooth scroll, mounted once at the root. Lenis runs off GSAP's ticker
 * (one RAF loop) and feeds ScrollTrigger, so scrubbed animation never trails the scrollbar.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    // fonts swap after first paint → line breaks and section heights change
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => gsap.ticker.remove(update);
  }, []);

  useLenis(() => ScrollTrigger.update());

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ duration: reducedMotion() ? 0 : 1.15, autoRaf: false, anchors: { offset: -80 } }}
    >
      <RouteSync />
      {children}
    </ReactLenis>
  );
}
