import { useFrame } from "@react-three/fiber";
import { BrightnessContrast, DepthOfField, EffectComposer, HueSaturation, N8AO, Noise, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode, type DepthOfFieldEffect } from "postprocessing";
import { useRef } from "react";
import * as THREE from "three";
import { hero } from "./heroState";
import { LOOK } from "./TrackHero";

/**
 * The "camera" on top of the render, used only for the offline frames (too heavy to run live):
 * ambient occlusion where the car meets the road, a lens' depth of field on the background,
 * glow on the lights, film tone curve, a light grade, vignette and grain.
 */
export function FilmLook() {
  const dof = useRef<DepthOfFieldEffect>(null);
  const target = useRef(new THREE.Vector3());
  useFrame(({ camera }) => {
    const d = dof.current;
    if (!d) return;
    LOOK.getPoint(hero.cam, target.current);
    // focus on what the camera looks at; the depth of field tightens once we are at the door
    d.target = target.current;
    const dist = camera.position.distanceTo(target.current);
    d.cocMaterial.focusRange = Math.max(0.6, dist * 0.75);
  });
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <N8AO aoRadius={0.9} distanceFalloff={0.8} intensity={3.6} quality="high" halfRes={false} />
      <DepthOfField ref={dof} focusDistance={5} focusRange={4} bokehScale={1.6} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <BrightnessContrast brightness={0.01} contrast={0.08} />
      <HueSaturation saturation={0.06} />
      <Vignette offset={0.3} darkness={0.45} />
      <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
      <SMAA />
    </EffectComposer>
  );
}
