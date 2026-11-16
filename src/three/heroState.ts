/**
 * Numbers the hero scroll animates. GSAP scrubs them; the R3F frame loop reads them.
 * No React state changes while scrolling.
 */
export const hero = {
  /** metres of road that have streamed under the car (the car "drives" while it stays in frame) */
  road: 0,
  /** road speed in m/s added every frame (idle cruise) */
  cruise: 2.2,
  /** 0..1 scissor doors */
  doors: 0,
  /** 0..1 headlights */
  lights: 0.25,
  /** 0..1 camera push toward the open door */
  zoom: 0,
  /** entrance: metres the car starts behind its mark */
  enter: 0,
  /** 0..1 how far the catalog panel has risen (the car is lifted in frame to stay visible above it) */
  panel: 0,
};

export const HERO_START = { ...hero };
