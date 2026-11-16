import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { RealCar, newPose, type PaintId } from "../three/RealCar";
import { WhiteStudio } from "../three/Studio";

/**
 * Internal still-render route (/__render?cam=x,y,z&look=x,y,z&fov=30&doors=0&hood=0&paint=carmine&alpha=1).
 * scripts/render-stills.mjs screenshots it to make the site's pictures of the car.
 */
const q = new URLSearchParams(window.location.search);
const vec = (k: string, d: [number, number, number]) => (q.get(k)?.split(",").map(Number) as [number, number, number]) ?? d;

function Rig() {
  const look = vec("look", [0, 0.6, 0]);
  const { scene, camera } = useThree();
  const pose = useRef(newPose());
  pose.current.doors = Number(q.get("doors") ?? 0);
  pose.current.hood = Number(q.get("hood") ?? 0);
  pose.current.lights = Number(q.get("lights") ?? 0.3);
  useFrame(() => camera.lookAt(...look));
  const { invalidate } = useThree();
  useEffect(() => {
    // demand mode: ask for a few frames so the pose, paint and environment are applied, then signal ready
    let n = 0;
    const tick = window.setInterval(() => {
      invalidate();
      if (++n === 6) {
        window.clearInterval(tick);
        const box = new THREE.Box3().setFromObject(scene);
        (window as unknown as { __info: unknown }).__info = { min: box.min.toArray(), max: box.max.toArray() };
        window.setTimeout(() => (document.getElementById("render")!.dataset.ready = "1"), 300);
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [scene, invalidate]);
  return (
    <group rotation-y={Number(q.get("rot") ?? 0)}>
      <RealCar paint={(q.get("paint") ?? "carmine") as PaintId} pose={pose} />
    </group>
  );
}

export default function RenderCar() {
  const alpha = q.get("alpha") === "1";
  useEffect(() => {
    document.documentElement.style.background = alpha ? "transparent" : "#fff";
    document.body.style.background = alpha ? "transparent" : "#fff";
  }, [alpha]);
  return (
    <div id="render" data-ready="0" style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        frameloop="demand"
        dpr={1}
        camera={{ position: vec("cam", [5, 1.6, 5]), fov: Number(q.get("fov") ?? 30) }}
        gl={{ alpha, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.AgXToneMapping }}
      >
        {!alpha && <color attach="background" args={["#ffffff"]} />}
        <Suspense fallback={null}>
          <WhiteStudio shadow={q.get("shadow") !== "0"} /> {/* taste-skill-ignore: 3D ground contact shadow */}
          <Rig />
        </Suspense>
      </Canvas>
    </div>
  );
}
