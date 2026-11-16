/**
 * Scroll-driven state of the hero car. GSAP scrubs these numbers (see Home hero timeline);
 * the R3F loop reads them each frame. Plain mutable object = no React re-renders while scrolling.
 */
export const heroState = {
  /** Car yaw. π = side profile with the nose pointing screen-left. */
  rot: Math.PI + 0.62,
  /** Distance the car has driven along its own heading (drive-off). */
  drive: 0,
  /** Ground travel under a stationary car ("driving in place"). */
  road: 0,
  /** 0..1 lights. */
  lights: 0,
  /** Camera dolly 0..1 (0 = wide, 1 = close). */
  dolly: 0,
};

/** Initial pose, restored whenever the home page mounts. */
export const HERO_START = { ...heroState };
