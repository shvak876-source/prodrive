import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { RealCar, type CarPose, type PaintId } from "./RealCar";
import { HDRI_URL, SoftShadow } from "./Studio";
import { hero } from "./heroState";

/** Must match --stage in CSS: the floor fades into it so the canvas has no visible edge. */
export const STAGE_BG = "#e6e6e3";
/** the model's lowest point sits 0.159 m below its origin; lift it so the tyres touch y = 0 */
const GROUND = 0.159;
/** floor albedo: darker than the backdrop because the studio lights brighten it to about --stage */
const FLOOR = "#a3a39e";
const WHEEL_R = 0.36;
const STRIPE_GAP = 4;

/** Puts the car (at the origin) into the left part of a wide screen; centred and higher on phones. */
function ViewOffset() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (size.width > 900) cam.setViewOffset(size.width, size.height, size.width * 0.22, -size.height * 0.04, size.width, size.height);
    else cam.setViewOffset(size.width, size.height, 0, size.height * 0.16, size.width, size.height);
    cam.updateProjectionMatrix();
    return () => cam.clearViewOffset();
  }, [camera, size]);
  return null;
}

/** Soft white light strips painted onto the floor; they stream backwards to sell speed. */
function FloorStripes() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    // the car faces −x while it drives in place, so the floor flows toward +x
    if (g.current) g.current.position.x = (hero.road % STRIPE_GAP) - STRIPE_GAP / 2;
  });
  return (
    <group ref={g} position-y={0.006}>
      {Array.from({ length: 12 }, (_, i) =>
        [-2.1, 2.1].map((z) => (
          <mesh key={`${i}${z}`} rotation-x={-Math.PI / 2} position={[(i - 6) * STRIPE_GAP, 0.002, z]}>
            <planeGeometry args={[2.2, 0.06]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Rig({ paint }: { paint: PaintId }) {
  const car = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const pose = useRef<CarPose>({ doors: 0, hood: 0, spin: 0, lights: 0 }) as MutableRefObject<CarPose>;
  const pointer = useRef(new THREE.Vector2());
  const look = useMemo(() => new THREE.Vector3(0, 0.55, 0), []);
  const { camera, size, scene } = useThree();
  useEffect(() => {
    const move = (e: PointerEvent) => pointer.current.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, []);

  useFrame((_, dt) => {
    const g = car.current;
    if (!g || !body.current) return;
    const h = hero;
    // only the body turns; the outer group carries position and the ground shadow
    body.current.rotation.y = h.yaw;
    // nose (+z in model space) after yaw points at (sin θ, 0, cos θ); entrance comes from behind the mark
    const d = h.drive - h.enter;
    g.position.set(h.pan + Math.sin(h.yaw) * d, GROUND, Math.cos(h.yaw) * d);
    const p = pose.current;
    p.spin = (h.drive - h.enter + h.road) / WHEEL_R; // tyres roll exactly with distance
    p.lights = h.lights;

    // camera: keeps the 5.4 m car inside the frame at any aspect, eases toward the pointer
    const aspect = size.width / size.height;
    const base = Math.max(12.5, 5.8 / (aspect * 0.5));
    const k = 1 - Math.pow(0.002, dt);
    const tx = 1.2 + pointer.current.x * 0.6;
    const ty = 1.45 - pointer.current.y * 0.25 - h.zoom * 0.35;
    const tz = base * (1 - h.zoom * 0.18);
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
    camera.lookAt(look);
    // fog starts just behind the car whatever the camera distance, so the car itself stays crisp
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = tz + 3;
      fog.far = tz + 24;
    }
  });

  return (
    <group ref={car}>
      <group ref={body}>
        <RealCar paint={paint} pose={pose} />
        {/* ground contact: a wide soft pool plus a tighter dark core under the body, both on the floor (taste-skill-ignore) */}
        <group position-y={-GROUND + 0.01}>
          <SoftShadow length={6.4} width={3.2} opacity={0.42} />
          <SoftShadow length={4.9} width={2.1} opacity={0.6} />
        </group>
      </group>
    </group>
  );
}

/**
 * The car on a pale studio floor: CC0 studio HDRI plus long softboxes for the paint's highlight
 * lines, a blurred reflective floor and a contact shadow at the tyre line so the car sits on the
 * ground instead of floating. Rendering stops when the stage is off-screen.
 */
export default function HeroStage({ paint }: { paint: PaintId }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  // phones, weak CPUs and the ?lite test switch get a plain floor instead of the reflective one
  const low = typeof window !== "undefined" && (innerWidth < 760 || (navigator.hardwareConcurrency ?? 8) <= 4 || location.search.includes("lite"));
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className="hero-canvas" aria-hidden="true">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, low ? 1.5 : 2]}
        camera={{ position: [1.2, 1.45, 11], fov: 28, near: 0.1, far: 80 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      >
        <color attach="background" args={[STAGE_BG]} />
        <fog attach="fog" args={[STAGE_BG, 14, 34]} />
        <ViewOffset />
        <Suspense fallback={null}>
          <Environment files={HDRI_URL} environmentIntensity={0.75}>
            {/* long overhead strips: the clean highlight lines along the bonnet and roof */}
            <Lightformer form="rect" intensity={2.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[14, 1.4, 1]} />
            <Lightformer form="rect" intensity={1.2} position={[0, 6, 3]} rotation-x={Math.PI / 2} scale={[14, 0.6, 1]} />
            <Lightformer form="rect" intensity={1.4} position={[0, 1.6, 9]} scale={[18, 1.2, 1]} />
          </Environment>
          <Rig paint={paint} />
          <FloorStripes />
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[120, 120]} />
            {low ? (
              <meshStandardMaterial color={FLOOR} roughness={0.9} />
            ) : (
              <MeshReflectorMaterial
                color={FLOOR}
                resolution={1024}
                blur={[500, 120]}
                mixBlur={1}
                mixStrength={1.6}
                mirror={0.35}
                roughness={0.9}
                metalness={0}
                depthScale={0.6}
                minDepthThreshold={0.5}
                maxDepthThreshold={1.3}
              />
            )}
          </mesh>
        </Suspense>
        <directionalLight position={[3, 7, 4]} intensity={0.8} />
        <ambientLight intensity={0.25} />
      </Canvas>
    </div>
  );
}
