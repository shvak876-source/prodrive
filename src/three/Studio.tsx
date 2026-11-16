import { Environment } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

/** Local CC0 studio HDRI (Poly Haven "Studio Small 03"), served from /public – no CDN at runtime. */
export const HDRI_URL = `${import.meta.env.BASE_URL}hdri/studio_small_03_1k.hdr`;

/** Soft ground shadow baked into a radial texture: grounds the car on white without a shadow pass. (taste-skill-ignore: 3D ground contact shadow) */
export function SoftShadow({ length = 5.4, width = 2.6, opacity = 0.6 }: { length?: number; width?: number; opacity?: number }) { // taste-skill-ignore: 3D ground contact shadow
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    grd.addColorStop(0, "rgba(0,0,0,1)");
    grd.addColorStop(0.45, "rgba(0,0,0,0.55)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.155, 0]} renderOrder={-1}>
      <planeGeometry args={[width, length]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** White photo-studio lighting: the HDRI gives the paint its softbox reflections. */
export function WhiteStudio({ shadow = true }: { shadow?: boolean }) { // taste-skill-ignore: 3D ground contact shadow
  return (
    <>
      <Environment files={HDRI_URL} environmentIntensity={1.05} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 5]} intensity={1.6} />
      {shadow && <SoftShadow />} {/* taste-skill-ignore: 3D ground contact shadow */}
    </>
  );
}
