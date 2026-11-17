import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { TrackScene } from "../three/TrackHero";
import { FilmLook } from "../three/FilmLook";
import { hero, heroAt } from "../three/heroState";
import type { PaintId } from "../three/paints";

/**
 * Internal frame-render route (/__shoot?p=0.5&paint=carmine): one frame of the hero story.
 * scripts/shoot-frames.mjs screenshots it for p = 0 … 1 and turns the frames into the scroll film.
 */
const q = new URLSearchParams(window.location.search);
Object.assign(hero, heroAt(Number(q.get("p") ?? 0)));

function Signal() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let n = 0;
    const tick = window.setInterval(() => {
      invalidate();
      if (++n === 8) {
        window.clearInterval(tick);
        window.setTimeout(() => (document.getElementById("shoot")!.dataset.ready = "1"), 300);
      }
    }, 300);
    return () => window.clearInterval(tick);
  }, [invalidate]);
  return null;
}

export default function ShootCar() {
  return (
    <div id="shoot" data-ready="0" style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        frameloop="demand"
        dpr={Number(q.get("dpr") ?? 1)}
        camera={{ fov: Number(q.get("fov") ?? 32), near: 0.05, far: 400 }}
        shadows="soft"
        gl={{ antialias: false, preserveDrawingBuffer: true, toneMapping: THREE.NoToneMapping }}
      >
        <TrackScene paint={(q.get("paint") ?? "carmine") as PaintId} live={false} film />
        {q.get("fx") !== "0" && <FilmLook />}
        <Signal />
      </Canvas>
    </div>
  );
}
