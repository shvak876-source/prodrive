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
