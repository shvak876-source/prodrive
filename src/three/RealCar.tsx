import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { PAINTS, type PaintId } from "./paints";
export { PAINTS, type PaintId };

/** Public path of the compressed model (meshopt + WebP). CC-BY 4.0, credited in the footer. */
export const CAR_URL = `${import.meta.env.BASE_URL}models/car.glb`;


/** Scroll/animation driven pose. Mutated by GSAP, read every frame (no React renders). */
export interface CarPose {
  /** 0 closed → 1 fully open (both doors) */
  doors: number;
  /** 0 closed → 1 open */
  hood: number;
  /** accumulated wheel roll in radians */
  spin: number;
  /** 0..1 head/tail lights */
  lights: number;
}

export const newPose = (): CarPose => ({ doors: 0, hood: 0, spin: 0, lights: 0 });

/** Israeli plate texture: yellow field, black characters, blue "IL" strip on the left. */
function plateTexture(text: string) {
  const c = document.createElement("canvas");
  c.width = 1040;
  c.height = 220;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f7c600";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#0b3d91";
  g.fillRect(0, 0, 150, c.height);
  g.fillStyle = "#fff";
  g.font = "700 64px Heebo, Arial, sans-serif";
  g.textAlign = "center";
  g.fillText("IL", 75, 170);
  g.strokeStyle = "#111";
  g.lineWidth = 10;
  g.strokeRect(5, 5, c.width - 10, c.height - 10);
  g.fillStyle = "#111";
  g.font = "800 128px Heebo, Arial, sans-serif";
  g.fillText(text, 595, 165);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  // glTF UV convention: textures are not flipped vertically
  t.flipY = false;
  return t;
}

interface RealCarProps {
  paint?: PaintId;
  pose?: MutableRefObject<CarPose>;
  plate?: string;
}

/**
 * The concept car (glTF). Doors, hood and wheels are separate nodes in the file, so the scroll story
 * can open the car up. Brand logos that ship with the sample asset are hidden; the license plate gets
 * our own Israeli-style plate.
 */
export function RealCar({ paint = "carmine", pose, plate = "PRO·DRIVE" }: RealCarProps) {
  const { scene } = useGLTF(CAR_URL);
  const model = useMemo(() => scene.clone(true), [scene]);

  // parts we animate, with their rest rotation
  const parts = useRef<{
    doorL?: THREE.Object3D;
    doorR?: THREE.Object3D;
    hood?: THREE.Object3D;
    wheels: THREE.Object3D[];
    rest: Map<THREE.Object3D, THREE.Euler>;
    lights: THREE.MeshStandardMaterial[];
    paints: THREE.MeshPhysicalMaterial[];
  }>({ wheels: [], rest: new Map(), lights: [], paints: [] });

  useLayoutEffect(() => {
    const p = parts.current;
    p.wheels = [];
    p.lights = [];
    p.paints = [];
    model.traverse((o) => {
      const name = o.name;
      if (name === "BodyDoorLColor1") p.doorL = o;
      if (name === "BodyDoorRColor1") p.doorR = o;
      if (name === "BodyHood") p.hood = o;
      if (/^Wheel(Front|Rear)[LR]$/.test(name)) p.wheels.push(o);
      if (name === "InteriorSteeringEmblem") o.visible = false;
      p.rest.set(o, o.rotation.clone());
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const mat = m as THREE.MeshPhysicalMaterial;
        if (!mat?.name) return;
        if (mat.name === "License") {
          mat.map = plateTexture(plate);
          mat.color.set("#ffffff");
          mat.needsUpdate = true;
        }
        if (/^Paint [12]/.test(mat.name)) p.paints.push(mat);
        // transmission renders the whole scene a second time every frame: tinted see-through glass instead
        if (mat.name === "Glass") {
          mat.transmission = 0;
          mat.transparent = true;
          mat.opacity = 0.32;
          mat.color.set("#1b2025");
          mat.roughness = 0.04;
          mat.metalness = 0.1;
          mat.depthWrite = false;
          mat.needsUpdate = true;
        }
        // the sample asset prints its maker's name on the tyre wall: plain rubber instead
        if (mat.name === "Tireside") {
          mat.map = null;
          mat.normalMap = null;
          mat.color.set("#151515");
          mat.needsUpdate = true;
        }
        if (/Headlight|Brakelight|Signallight/.test(mat.name)) p.lights.push(mat);
        mat.envMapIntensity = 1;
      });
    });
  }, [model, plate]);

  // repaint when the chosen finish changes
  useLayoutEffect(() => {
    const f = PAINTS[paint];
    for (const m of parts.current.paints) {
      // Paint 2 is the satin-black lower body; only the main colour (Paint 1) changes
      if (!m.name.startsWith("Paint 1")) continue;
      m.color.set(f.color);
      m.metalness = f.metalness;
      m.roughness = f.roughness;
      m.clearcoat = 1;
      m.clearcoatRoughness = 0.03;
      // the flake normal map reads as grain on screen: keep a hint of it only
      m.normalScale?.set(0.08, 0.08);
      if ("iridescence" in m) m.iridescence = 0;
      m.needsUpdate = true;
    }
  }, [paint, model]);

  useFrame(() => {
    const p = parts.current;
    const s = pose?.current;
    if (!s) return;
    // doors swing outward around their hinge (the asset's pivots sit on the hinge line)
    // scissor doors: hinge at the A-pillar, swing up about the car's lateral (x) axis
    if (p.doorL) p.doorL.rotation.x = p.rest.get(p.doorL)!.x + s.doors * 1.2;
    if (p.doorR) p.doorR.rotation.x = p.rest.get(p.doorR)!.x + s.doors * 1.2;
    // front clamshell tilts up from its front hinge
    if (p.hood) p.hood.rotation.x = p.rest.get(p.hood)!.x + s.hood * 0.42;
    for (const w of p.wheels) w.rotation.x = p.rest.get(w)!.x + s.spin;
    for (const m of p.lights) m.emissiveIntensity = 0.4 + s.lights * 6;
  });

  return <primitive object={model} />;
}

useGLTF.preload(CAR_URL);
