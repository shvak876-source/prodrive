import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { CarModel, type BodyType } from "../three/CarModel";
import { StudioEnv } from "../three/Studio";

/** Keeps the camera aimed at the car's centre (R3F re-aims cameras after onCreated). */
function Aim() {
  useFrame(({ camera }) => camera.lookAt(0.15, 0.66, 0));
  return null;
}

/**
 * Internal route (/__render?type=suv&color=%23112233) that renders one car on a transparent
 * background. scripts/render-thumbs.mjs screenshots it to build the catalog images.
 */
export default function RenderCar() {
  const params = new URLSearchParams(window.location.search);
  const type = (params.get("type") ?? "sedan") as BodyType;
  const color = params.get("color") ?? "#1d2a3a";
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // transparent page so the PNG keeps its alpha channel
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    const id = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div style={{ width: "100vw", height: "100vh", background: "transparent" }} data-ready={ready ? "1" : "0"} id="render">
      <Canvas
        dpr={1}
        camera={{ position: [-5.9, 1.85, 6.7], fov: 24 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          <StudioEnv />
          <Aim />
          <group rotation-y={Math.PI}>
            <CarModel color={color} type={type} lights={0.5} />
          </group>
          <ContactShadows position={[0, 0.005, 0]} scale={8} far={1.5} blur={2} opacity={0.75} resolution={512} />
        </Suspense>
        <spotLight position={[2, 7, 3]} angle={0.5} penumbra={1} intensity={60} color="#fff4e6" />
      </Canvas>
    </div>
  );
}
