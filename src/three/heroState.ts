/**
 * Numbers the hero scroll animates. GSAP scrubs them; the R3F frame loop reads them.
 * No React state changes while scrolling.
 */
export const hero = {
  /** car yaw (rad). 0 = nose to camera; −π/2 = side profile, nose to the left */
  yaw: -0.62,
  /** metres travelled along the car's heading (the exit) */
  drive: 0,
  /** metres of floor streaming under a stationary car (driving in place) */
  road: 0,
  /** 0..1 headlights */
  lights: 0.15,
  /** 0..1 camera push-in */
  zoom: 0,
  /** entrance: metres the car starts behind its mark */
  enter: 0,
  /** sideways shift of the car's mark (m, +x = toward the text) so the side profile stays in frame */
  pan: 0,
};

export const HERO_START = { ...hero };
