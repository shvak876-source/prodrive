import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { RealCar, type CarPose, type PaintId } from "./RealCar";
import { SoftShadow } from "./Studio";
import { hero } from "./heroState";

/** Daylight CC0 HDRI (Poly Haven "Quarry 01") for the paint's reflections, served locally. */
const SKY_HDRI = `${import.meta.env.BASE_URL}hdri/quarry_01_1k.hdr`;
/** Haze the far road dissolves into. Must match --sky in CSS. */
export const HAZE = "#cfd3d6";
const GROUND = 0.159; // the model's lowest point is 0.159 m below its origin
const WHEEL_R = 0.36;

/* ------------------------------------------------------------------ road surface */

/** Asphalt tile: grain, darker tyre lanes, faint cracks and patches. Repeats in both directions. */
function asphaltTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d")!;
  g.fillStyle = "#3f4144";
  g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 90000; i++) {
    const v = 40 + Math.random() * 70;
    g.fillStyle = `rgba(${v},${v + 1},${v + 3},${0.18 + Math.random() * 0.4})`;
    const s = Math.random() < 0.06 ? 3 : 1.4;
    g.fillRect(Math.random() * 1024, Math.random() * 1024, s, s);
  }
  // patches of older, lighter tarmac
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(120,120,118,${0.05 + Math.random() * 0.05})`;
    g.fillRect(Math.random() * 900, Math.random() * 900, 80 + Math.random() * 200, 40 + Math.random() * 120);
  }
  // hairline cracks
  g.strokeStyle = "rgba(20,20,20,0.35)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) {
    let x = Math.random() * 1024;
    let y = Math.random() * 1024;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 8; k++) g.lineTo((x += (Math.random() - 0.5) * 60), (y += (Math.random() - 0.5) * 60));
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/**
 * Road paint: Hebrew lines written on the asphalt the way road markings are – white, slightly
 * worn (speckled holes), stretched along the road so they read right from the low camera.
 */
function paintTexture(lines: { text: string; size: number; weight: number }[], w = 2048, h = 760) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.direction = "rtl";
  g.textAlign = "right";
  g.fillStyle = "#f2f0ea";
  let y = 0;
  for (const l of lines) {
    // shrink each line until it fits the canvas width (with a margin)
    let size = l.size;
    g.font = `${l.weight} ${size}px Karantina, Heebo, sans-serif`;
    while (g.measureText(l.text).width > w - 120 && size > 20) {
      size -= 6;
      g.font = `${l.weight} ${size}px Karantina, Heebo, sans-serif`;
    }
    y += size * 0.92;
    g.fillText(l.text, w - 60, y);
    y += size * 0.14;
  }
  // wear: punch tiny holes into the paint
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(0,0,0,${0.3 + Math.random() * 0.7})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** The road runs left-right across the whole screen; the headline is painted on it in front of the car. */
function Road({ title, sub, portrait }: { title: string; sub: string; portrait: boolean }) {
  const asphalt = useMemo(() => {
    const t = asphaltTexture();
    t.repeat.set(40, 30); // 1 tile ≈ 4 m
    return t;
  }, []);
  const [paint, setPaint] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    // the canvas can only draw Karantina once the font has loaded
    document.fonts.load("700 300px Karantina").finally(() => {
      if (!alive) return;
      const t = title.replace(/\.$/, "");
      // phones: the title breaks into two big lines so it stays readable on a narrow screen
      const lines = portrait
        ? [...t.split(". ").map((x, i, a) => ({ text: i < a.length - 1 ? x + "." : x, size: 420, weight: 700 })), { text: sub, size: 150, weight: 700 }]
        : [{ text: t, size: 330, weight: 700 }, { text: sub, size: 140, weight: 700 }];
      setPaint(paintTexture(lines, 2048, portrait ? 1100 : 760));
    });
    return () => {
      alive = false;
    };
  }, [title, sub, portrait]);

  return (
    <group>
      {/* asphalt, 160 m long and deep enough to reach behind the camera on tall phone screens */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 20]}>
        <planeGeometry args={[160, 120]} />
        <meshStandardMaterial map={asphalt} roughness={0.9} metalness={0} />
      </mesh>
      {/* lane markings along the road: dashed centre behind the car, solid edge line in front */}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[(i - 15) * 6, 0.004, -1.9]}>
          <planeGeometry args={[3, 0.14]} />
          <meshStandardMaterial color="#e8e6df" roughness={0.7} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 5.4]}>
        <planeGeometry args={[120, 0.16]} />
        <meshStandardMaterial color="#e8e6df" roughness={0.7} />
      </mesh>
      {/* the painted headline, between the car and the camera */}
      {paint && (
        /* stretched along the road, as real road markings are, so they read from a low viewpoint */
        <mesh rotation-x={-Math.PI / 2} position={portrait ? [0.1, 0.006, 6.8] : [0.15, 0.006, 2.6]}>
          <planeGeometry args={portrait ? [2.7, 2.7 * (1100 / 2048) * 2.4] : [4.1, 4.1 * (760 / 2048) * 1.5]} />
          <meshStandardMaterial map={paint} transparent roughness={0.6} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ camera path */

// Car faces +x (to the right on screen). Model space +z (nose) → world +x; model −x (right side) → world +z.
// Path: wide side view → in front of the open door → through it → seated, looking out of the windshield.
const CAM = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.2, 2.0, 7.6),
  new THREE.Vector3(0.1, 1.6, 5.4),
  new THREE.Vector3(-0.05, 1.25, 2.9),
  new THREE.Vector3(-0.15, 1.05, 1.25),
  new THREE.Vector3(-0.35, 1.0, 0.3),
]);
const LOOK = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.2, 0.3, 1.5),
  new THREE.Vector3(0.0, 0.7, 0.6),
  new THREE.Vector3(-0.1, 0.85, 0.2),
  new THREE.Vector3(1.2, 0.9, 0.2),
  new THREE.Vector3(4.0, 0.9, 0.25),
]);

function Rig({ paint }: { paint: PaintId }) {
  const car = useRef<THREE.Group>(null);
  const pose = useRef<CarPose>({ doors: 0, hood: 0, spin: 0, lights: 0 }) as MutableRefObject<CarPose>;
  const pointer = useRef(new THREE.Vector2());
  const p = useMemo(() => new THREE.Vector3(), []);
  const l = useMemo(() => new THREE.Vector3(), []);
  const { camera, size } = useThree();
  useEffect(() => {
    const move = (e: PointerEvent) => pointer.current.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, []);

  useFrame(() => {
    const h = hero;
    if (!car.current) return;
    car.current.position.set(-h.enter, GROUND, 0); // drives in from the left
    const q = pose.current;
    q.spin = -h.enter / WHEEL_R;
    q.doors = h.doors;
    q.lights = h.lights;

    // wide view keeps the car at ~70% of the width on any screen
    const aspect = size.width / size.height;
    const widen = Math.max(1, 1.6 / aspect) ** 0.85;
    CAM.getPoint(h.cam, p);
    LOOK.getPoint(h.cam, l);
    const outside = 1 - Math.min(1, h.cam * 2.5); // pointer sway and widening fade out on the way in
    p.z = p.z * (1 + (widen - 1) * outside);
    p.y = p.y * (1 + (widen - 1) * 0.4 * outside);
    p.x += pointer.current.x * 0.45 * outside;
    p.y -= pointer.current.y * 0.18 * outside;
    camera.position.copy(p);
    camera.lookAt(l);
  });

  return (
    <group ref={car}>
      <group rotation-y={Math.PI / 2}>
        <RealCar paint={paint} pose={pose} />
        <group position-y={-GROUND + 0.01}>
          <SoftShadow length={6.2} width={3} opacity={0.55} /> {/* taste-skill-ignore: 3D ground contact shadow */}
          <SoftShadow length={4.9} width={2.05} opacity={0.75} /> {/* taste-skill-ignore: 3D ground contact shadow */}
        </group>
      </group>
    </group>
  );
}

function Ready({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

/** The landing page's road: asphalt across the screen, the headline painted on it, the car on it. */
export default function RoadHero({ paint, title, sub, onReady }: { paint: PaintId; title: string; sub: string; onReady?: () => void }) {
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
  const portrait = typeof window !== "undefined" && innerHeight > innerWidth * 1.1;
  return (
    <div ref={wrap} className="hero-canvas" aria-hidden="true">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, phone ? 1.25 : 1.5]}
        camera={{ position: [0.2, 2.0, 7.6], fov: 30, near: 0.05, far: 120 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <color attach="background" args={[HAZE]} />
        <fog attach="fog" args={[HAZE, 18, 55]} />
        <Suspense fallback={null}>
          <Environment files={SKY_HDRI} environmentIntensity={0.9} />
          <Road title={title} sub={sub} portrait={portrait} />
          <Rig paint={paint} />
          <Ready onReady={onReady} />
        </Suspense>
        <directionalLight position={[-5, 7, 4]} intensity={1.2} color="#fff3e0" />
        <hemisphereLight args={["#eef2f5", "#6f716e", 0.5]} />
      </Canvas>
    </div>
  );
}
