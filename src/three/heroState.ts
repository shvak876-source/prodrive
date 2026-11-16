/**
 * Numbers the hero scroll animates. GSAP scrubs them; the R3F frame loop reads them.
 * No React state changes while scrolling.
 */
export const hero = {
  /** 0 → 1 position along the camera path: side view → at the door → inside the cabin */
  cam: 0,
  /** 0..1 scissor doors */
  doors: 0,
  /** 0..1 headlights */
  lights: 0.3,
  /** entrance: metres the car starts behind its mark (it drives in from the left) */
  enter: 0,
};

export const HERO_START = { ...hero };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const inOut = (x: number, k: number) => (x < 0.5 ? 2 ** (k - 1) * x ** k : 1 - (-2 * x + 2) ** k / 2);

/**
 * The hero story at p (0..1), the same curve the live scroll timeline plays:
 * doors swing up 0.15–0.95, camera to the door 0.1–1.1, through it into the seat 1.1–2.2 (of 2.2).
 * Used to render the offline scroll frames.
 */
export function heroAt(p: number) {
  const s = p * 2.2;
  const doors = inOut(clamp01((s - 0.15) / 0.8), 2);
  const cam = s < 1.1 ? 0.45 * inOut(clamp01((s - 0.1) / 1.0), 1.5) : 0.45 + 0.55 * inOut(clamp01((s - 1.1) / 1.1), 2);
  return { cam, doors, lights: 0.3 + 0.7 * doors, enter: 0 };
}
