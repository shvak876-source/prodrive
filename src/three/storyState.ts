import type { CarPose } from "./RealCar";

/**
 * Everything the pinned scroll story animates on the car. GSAP scrubs these plain numbers; the
 * R3F frame loop reads them. No React state is touched while scrolling.
 */
export interface Story extends CarPose {
  /** car yaw in radians; 0 = nose toward the camera, −π/2 = side profile with the nose to the left */
  yaw: number;
  /** distance driven along the car's own heading (the exit) */
  drive: number;
  /** 0 = wide shot, 1 = close */
  zoom: number;
  /** extra rise of the car on entrance (drops into place) */
  lift: number;
}

export const STORY_START: Story = { yaw: -0.72, drive: 0, zoom: 0, lift: 0, doors: 0, hood: 0, spin: 0, lights: 0 };

export const story: Story = { ...STORY_START };
