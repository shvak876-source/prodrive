import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { RealCar, type CarPose, type PaintId } from "./RealCar";
import { SoftShadow } from "./Studio";
import { hero } from "./heroState";

/** Daylight CC0 HDRI (Poly Haven "Quarry 01"): sky reflections in the paint, served locally. */
const SKY_HDRI = `${import.meta.env.BASE_URL}hdri/quarry_01_1k.hdr`;
/** Haze colour: the road dissolves into it. Must match --sky in CSS. */
export const HAZE = "#d9dde0";
/** the model's lowest point sits 0.159 m below its origin */
const GROUND = 0.159;
const WHEEL_R = 0.36;
/** car heading on the road: three-quarter view, nose toward the camera and to the left */
const HEADING = -0.68;
/** one texture tile of road covers this many metres along the road */
const TILE = 12;

/** Asphalt: fine grain, a dashed centre line, solid edge lines and a darker kerb strip. */
function useAsphalt() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 1024; // u across the road, v along it
    const g = c.getContext("2d")!;
    g.fillStyle = "#4a4c4f";
    g.fillRect(0, 0, c.width, c.height);
    // grain: thousands of tiny light/dark specks
    for (let i = 0; i < 26000; i++) {
      const v = 60 + Math.random() * 50;
      g.fillStyle = `rgba(${v},${v + 2},${v + 4},${0.25 + Math.random() * 0.35})`;
      g.fillRect(Math.random() * c.width, Math.random() * c.height, 1.6, 1.6);
    }
    // tyre-worn lanes: slightly darker bands
    g.fillStyle = "rgba(20,20,22,0.12)";
    [0.2, 0.32, 0.68, 0.8].forEach((u) => g.fillRect(u * c.width - 18, 0, 36, c.height));
    // edge lines
    g.fillStyle = "#e9e9e4";
    g.fillRect(26, 0, 10, c.height);
    g.fillRect(c.width - 36, 0, 10, c.height);
    // dashed centre line: 3 m dash, 3 m gap within a 12 m tile
    const dash = c.height / 4;
    for (let y = 0; y < c.height; y += dash * 2) g.fillRect(c.width / 2 - 5, y, 10, dash);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  }, []);
}

/** The road runs along the car's heading; its texture slides backwards as the car "drives". */
function Road() {
  const tex = useAsphalt();
  const LEN = 240;
  useMemo(() => tex.repeat.set(1, LEN / TILE), [tex]);
  useFrame(() => {
    tex.offset.y = (hero.road / TILE) % 1;
  });
  return (
    <group rotation-y={HEADING}>
      {/* verge on both sides: pale concrete, so the scene stays light */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.002}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#b9bbb8" roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[7.4, LEN]} />
        <meshStandardMaterial map={tex} roughness={0.82} metalness={0} />
      </mesh>
    </group>
  );
}

/** Car on its mark (or driving onto it), doors from the story, camera framing it into the left half. */
function Rig({ paint }: { paint: PaintId }) {
  const car = useRef<THREE.Group>(null);
  const pose = useRef<CarPose>({ doors: 0, hood: 0, spin: 0, lights: 0 }) as MutableRefObject<CarPose>;
  const pointer = useRef(new THREE.Vector2());
  const look = useMemo(() => new THREE.Vector3(), []);
  const { camera, size, scene } = useThree();
  useEffect(() => {
    const move = (e: PointerEvent) => pointer.current.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, []);

  useFrame((_, dt) => {
    const h = hero;
    const g = car.current;
    if (!g) return;
    h.road += h.cruise * Math.min(dt, 0.05); // always rolling a little: the scene is never static
    // entrance: the car comes from behind its mark along its own heading
    g.position.set(-Math.sin(HEADING) * h.enter, GROUND, -Math.cos(HEADING) * h.enter);
    const p = pose.current;
    p.spin = (h.road - h.enter) / WHEEL_R;
    p.doors = h.doors;
    p.lights = h.lights;

    // framing: the car fills about half the width on desktop, nearly all of it on a phone
    const aspect = size.width / size.height;
    const wide = aspect > 1.1;
    const dist = (wide ? Math.max(9.6, 7.6 / (aspect * 0.5)) : 5.6 / (aspect * 0.5)) * (1 - h.zoom * 0.18);
    const k = 1 - Math.pow(0.002, dt);
    // orbit a little toward the driver's door as the doors open
    const ang = 0.12 + h.zoom * 0.22 + pointer.current.x * 0.05;
    const tx = Math.sin(ang) * dist;
    const tz = Math.cos(ang) * dist;
    const ty = 1.25 - pointer.current.y * 0.15 + h.zoom * 0.2;
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
    // as the catalog panel rises, aim lower so the car rides up into the top of the frame
    look.set(0, 0.55 - h.panel * 1.1, 0);
    camera.lookAt(look);
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = dist + 4;
      fog.far = dist + 46;
    }
  });

  return (
    <group ref={car}>
      <group rotation-y={HEADING}>
        <RealCar paint={paint} pose={pose} />
        <group position-y={-GROUND + 0.012}>
          <SoftShadow length={6.2} width={3} opacity={0.5} /> {/* taste-skill-ignore: 3D ground contact shadow */}
          <SoftShadow length={4.9} width={2.05} opacity={0.75} /> {/* taste-skill-ignore: 3D ground contact shadow */}
        </group>
      </group>
    </group>
  );
}

/** Shifts the projection so the car sits in the left half of a wide screen (text on the right). */
function ViewOffset() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (size.width > 900) cam.setViewOffset(size.width, size.height, size.width * 0.2, -size.height * 0.1, size.width, size.height);
    else cam.setViewOffset(size.width, size.height, 0, size.height * 0.2, size.width, size.height);
    cam.updateProjectionMatrix();
    return () => cam.clearViewOffset();
  }, [camera, size]);
  return null;
}

/** The hero's world: the car on an open road under a pale daylight haze. */
export default function RoadStage({ paint }: { paint: PaintId }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const phone = typeof window !== "undefined" && innerWidth < 760;
  return (
    <div ref={wrap} className="hero-canvas" aria-hidden="true">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, phone ? 1.5 : 2]}
        camera={{ position: [1, 1.25, 10], fov: 28, near: 0.1, far: 140 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <color attach="background" args={[HAZE]} />
        <fog attach="fog" args={[HAZE, 14, 60]} />
        <ViewOffset />
        <Suspense fallback={null}>
          <Environment files={SKY_HDRI} environmentIntensity={0.9} />
          <Road />
          <Rig paint={paint} />
        </Suspense>
        {/* low warm sun from behind-left: long highlights on the paint */}
        <directionalLight position={[-6, 5, -3]} intensity={1.1} color="#fff1dc" />
        <hemisphereLight args={["#e9eef2", "#8d8f8c", 0.45]} />
      </Canvas>
    </div>
  );
}
