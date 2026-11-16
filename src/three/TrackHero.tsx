import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { RealCar, type CarPose, type PaintId } from "./RealCar";
import { SoftShadow } from "./Studio";
import { hero } from "./heroState";

/**
 * The landing shot: the car at a low front three-quarter angle (nose to the right) on a track
 * apron, in front of a real photographed horizon and sky (CC0 Poly Haven HDRI, projected onto the
 * ground). The same scene is rendered offline into scroll frames (/__shoot), and runs live as a
 * fallback when there are no frames.
 */
const SKY_HDRI = `${import.meta.env.BASE_URL}hdri/quarry_01_1k.hdr`;
const GROUND = 0.159; // the model's lowest point is 0.159 m below its origin
const WHEEL_R = 0.36;

/* ------------------------------------------------------------------ track surface */

function asphaltTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d")!;
  g.fillStyle = "#38393a";
  g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 120000; i++) {
    const v = 20 + Math.random() * 110;
    g.fillStyle = `rgba(${v},${v},${v + 2},${0.35 + Math.random() * 0.55})`;
    const s = Math.random() < 0.12 ? 4 : 2;
    g.fillRect(Math.random() * 1024, Math.random() * 1024, s, s);
  }
  // mid-scale mottling, so the surface still reads as tarmac at a distance
  for (let i = 0; i < 2500; i++) {
    const v = Math.random() < 0.5 ? 20 : 95;
    g.fillStyle = `rgba(${v},${v},${v},0.1)`;
    g.beginPath();
    g.arc(Math.random() * 1024, Math.random() * 1024, 4 + Math.random() * 22, 0, 7);
    g.fill();
  }
  for (let i = 0; i < 5; i++) {
    g.fillStyle = `rgba(25,25,25,${0.05 + Math.random() * 0.06})`; // rubber laid down by tyres
    g.fillRect(0, Math.random() * 1024, 1024, 30 + Math.random() * 90);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Radial alpha: the tarmac melts into the photographed ground of the backdrop. */
function fadeTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  r.addColorStop(0, "#fff");
  r.addColorStop(0.55, "#fff");
  r.addColorStop(1, "#000");
  g.fillStyle = r;
  g.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(c);
}

/** Red-and-white kerb blocks along an arc: what makes tarmac read as a race track. */
function Kerb({ radius, from, to, cx, cz }: { radius: number; from: number; to: number; cx: number; cz: number }) {
  const blocks = useMemo(() => {
    const out: { x: number; z: number; r: number; red: boolean }[] = [];
    const step = 1.0 / radius;
    let i = 0;
    for (let a = from; a < to; a += step, i++) out.push({ x: cx + Math.cos(a) * radius, z: cz + Math.sin(a) * radius, r: -a, red: i % 2 === 0 });
    return out;
  }, [radius, from, to, cx, cz]);
  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, 0.03, b.z]} rotation-y={b.r}>
          <boxGeometry args={[0.7, 0.06, 1.0]} />
          <meshStandardMaterial color={b.red ? "#c4231b" : "#ecebe6"} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function Track() {
  const asphalt = useMemo(() => {
    const t = asphaltTexture();
    t.repeat.set(14, 14);
    return t;
  }, []);
  const fade = useMemo(fadeTexture, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <circleGeometry args={[46, 96]} />
        <meshStandardMaterial color="#c3c9d2" map={asphalt} bumpMap={asphalt} bumpScale={0.6} alphaMap={fade} transparent roughness={0.82} metalness={0} depthWrite={false} />
      </mesh>
      {/* the circuit's edge: kerb on the apex behind the car, painted edge line sweeping toward the camera */}
      <Kerb radius={36} from={Math.PI * 1.25} to={Math.PI * 1.8} cx={2} cz={30} />
      <mesh rotation-x={-Math.PI / 2} position={[2, 0.006, 30]}>
        <ringGeometry args={[34.9, 35.1, 256, 1, Math.PI * 0.22, Math.PI * 0.53]} />
        <meshStandardMaterial color="#e9e7e0" roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ camera path */

// The car's nose is +z. The camera starts low at its front-right corner (nose points right on
// screen), swings round to the open door, goes through it and sits looking out of the windshield.
export const CAM = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-3.75, 0.9, 5.35),
  new THREE.Vector3(-4.1, 1.15, 2.2),
  new THREE.Vector3(-2.5, 1.2, 0.2),
  new THREE.Vector3(-1.2, 1.12, -0.05),
  new THREE.Vector3(-0.32, 1.1, 0.05),
]);
export const LOOK = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.35, 0.92, 0.45),
  new THREE.Vector3(-0.2, 0.7, 0.1),
  new THREE.Vector3(-0.3, 0.85, -0.2),
  new THREE.Vector3(-0.3, 0.9, 1.4),
  new THREE.Vector3(-0.25, 0.9, 4.0),
]);

function Rig({ paint, live }: { paint: PaintId; live: boolean }) {
  const car = useRef<THREE.Group>(null);
  const pose = useRef<CarPose>({ doors: 0, hood: 0, spin: 0, lights: 0 }) as MutableRefObject<CarPose>;
  const pointer = useRef(new THREE.Vector2());
  const p = useMemo(() => new THREE.Vector3(), []);
  const l = useMemo(() => new THREE.Vector3(), []);
  const { camera, size } = useThree();
  useEffect(() => {
    if (!live) return;
    const move = (e: PointerEvent) => pointer.current.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, [live]);

  useFrame(() => {
    const h = hero;
    if (!car.current) return;
    car.current.position.set(0, GROUND, -h.enter); // rolls in from behind
    const q = pose.current;
    q.spin = h.enter / WHEEL_R;
    q.doors = h.doors;
    q.lights = h.lights;

    // narrow screens step back so the whole car stays in frame
    const aspect = size.width / size.height;
    const widen = Math.max(1, 1.55 / aspect) ** 0.9;
    CAM.getPoint(h.cam, p);
    LOOK.getPoint(h.cam, l);
    const outside = 1 - Math.min(1, h.cam * 2.5);
    p.x = l.x + (p.x - l.x) * (1 + (widen - 1) * outside);
    p.z = l.z + (p.z - l.z) * (1 + (widen - 1) * outside);
    p.x += pointer.current.x * 0.25 * outside;
    p.y -= pointer.current.y * 0.1 * outside;
    camera.position.copy(p);
    camera.lookAt(l);
  });

  return (
    <group ref={car}>
      <RealCar paint={paint} pose={pose} />
      <group position-y={-GROUND + 0.012}>
        <SoftShadow length={6.2} width={3} opacity={0.75} /> {/* taste-skill-ignore: 3D ground contact shadow */}
        <SoftShadow length={4.9} width={2.05} opacity={0.95} /> {/* taste-skill-ignore: 3D ground contact shadow */}
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

/** Everything inside the canvas; shared by the live hero and the offline frame renderer. */
export function TrackScene({ paint, live = true, onReady }: { paint: PaintId; live?: boolean; onReady?: () => void }) {
  return (
    <>
      <Suspense fallback={null}>
        <Environment
          files={SKY_HDRI}
          background
          backgroundBlurriness={0.02}
          environmentIntensity={0.95}
          backgroundRotation={[0, Math.PI * 0.62, 0]}
          environmentRotation={[0, Math.PI * 0.62, 0]}
        />
        <Track />
        <Rig paint={paint} live={live} />
        <Ready onReady={onReady} />
      </Suspense>
      <directionalLight position={[-6, 6, -5]} intensity={1.4} color="#fff1dc" />
      <hemisphereLight args={["#e8eef4", "#5e5a52", 0.35]} />
    </>
  );
}

export default function TrackHero({ paint, onReady }: { paint: PaintId; onReady?: () => void }) {
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
        dpr={[1, phone ? 1.25 : 1.5]}
        camera={{ position: [-3.75, 0.9, 5.35], fov: 32, near: 0.05, far: 400 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <TrackScene paint={paint} onReady={onReady} />
      </Canvas>
    </div>
  );
}
