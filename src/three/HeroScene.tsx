import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, MeshReflectorMaterial } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CarModel, type CarLive } from "./CarModel";
import { StudioEnv } from "./Studio";
import { heroState } from "./heroState";

const BG = "#0a0a0c";
const DASH_GAP = 3.2;

/** Shifts the projection so the car (at the world origin) sits in the left half on wide screens. */
function ViewOffset() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const wide = size.width > 900;
    if (wide) cam.setViewOffset(size.width, size.height, size.width * 0.23, 0, size.width, size.height);
    else cam.setViewOffset(size.width, size.height, 0, size.height * 0.12, size.width, size.height);
    cam.updateProjectionMatrix();
    return () => {
      cam.clearViewOffset();
    };
  }, [camera, size]);
  return null;
}

function Rig() {
  const car = useRef<THREE.Group>(null);
  const dashes = useRef<THREE.Group>(null);
  const live = useRef<CarLive>({ wheelSpin: 0, lights: 0 });
  const pointer = useRef(new THREE.Vector2());
  const look = useMemo(() => new THREE.Vector3(0, 0.7, 0), []);
  const { camera, size } = useThree();

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, dt) => {
    const s = heroState;
    const g = car.current;
    if (!g) return;
    g.rotation.y = s.rot;
    // drive along the car's own heading: local +x (nose) → world (cos θ, 0, −sin θ)
    g.position.set(Math.cos(s.rot) * s.drive, 0, -Math.sin(s.rot) * s.drive);
    // wheels roll with every unit travelled (arc length / radius)
    live.current.wheelSpin = (s.drive + s.road) / 0.36;
    live.current.lights = s.lights;
    // car faces −x while cruising, so the road slides toward +x underneath it
    if (dashes.current) dashes.current.position.x = s.road % DASH_GAP;

    // camera: scroll dolly + gentle pointer parallax, eased with frame delta
    const k = 1 - Math.pow(0.002, dt);
    // distance keeps the car ~45% of the width on desktop and ~88% on a phone (tan(12°)·2 ≈ 0.425)
    const aspect = size.width / size.height;
    const base = Math.max(17.5, 6.1 / (aspect * 0.425));
    const tx = pointer.current.x * 0.9;
    const ty = 2.5 - pointer.current.y * 0.35 - s.dolly * 0.5;
    const tz = base * (1 - s.dolly * 0.16);
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
    camera.lookAt(look);
  });

  return (
    <>
      <group ref={car}>
        <CarModel color="#2b4f7a" live={live} />
        <ContactShadows position={[0, 0.005, 0]} scale={7} far={1.6} blur={2.2} opacity={0.85} resolution={512} color="#000" />
      </group>
      {/* road dashes that slide under the car to sell speed */}
      <group ref={dashes}>
        {Array.from({ length: 14 }, (_, i) =>
          [1.75, -1.75].map((z) => (
            <mesh key={`${i}${z}`} position={[(i - 7) * DASH_GAP, 0.004, z]} rotation-x={-Math.PI / 2}>
              <planeGeometry args={[1.4, 0.05]} />
              <meshBasicMaterial color="#3b3b42" />
            </mesh>
          )),
        )}
      </group>
    </>
  );
}

function Floor({ low }: { low: boolean }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
      <planeGeometry args={[80, 80]} />
      {low ? (
        <meshStandardMaterial color="#0d0d10" roughness={0.6} metalness={0.2} />
      ) : (
        <MeshReflectorMaterial
          resolution={1024}
          blur={[400, 100]}
          mixBlur={1}
          mixStrength={14}
          roughness={0.9}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#0c0c0f"
          metalness={0.6}
          mirror={0.6}
        />
      )}
    </mesh>
  );
}

/** Soft warm glow behind the car – a studio cyclorama without a visible horizon. */
function Backdrop() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(214,176,122,0.32)");
    grd.addColorStop(0.45, "rgba(120,110,140,0.10)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh position={[0, 2.2, -9]} scale={[26, 13, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={tex} transparent depthWrite={false} fog={false} />
    </mesh>
  );
}

/** Full-bleed hero canvas. Pauses rendering when scrolled out of view. */
export default function HeroScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const low = typeof window !== "undefined" && (window.innerWidth < 700 || (navigator.hardwareConcurrency ?? 8) <= 4);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="hero-canvas" aria-hidden="true">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, low ? 1.5 : 2]}
        camera={{ position: [0, 2.5, 18], fov: 24, near: 0.5, far: 90 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: false }}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 20, 46]} />
        <ViewOffset />
        <Suspense fallback={null}>
          <StudioEnv />
          <Rig />
          <Floor low={low} />
        </Suspense>
        <Backdrop />
        <spotLight position={[1, 9, 4]} angle={0.45} penumbra={1} intensity={140} color="#fff4e6" />
        <spotLight position={[-6, 3, -4]} angle={0.6} penumbra={1} intensity={60} color="#d6b07a" />
      </Canvas>
    </div>
  );
}
