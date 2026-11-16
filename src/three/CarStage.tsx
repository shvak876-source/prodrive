import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { RealCar, type CarPose, type PaintId } from "./RealCar";
import { SoftShadow, WhiteStudio } from "./Studio"; // taste-skill-ignore: 3D ground contact shadow
import { story } from "./storyState";

/** Applies the story numbers to the car group and frames it with an eased camera. */
function Rig({ paint }: { paint: PaintId }) {
  const car = useRef<THREE.Group>(null);
  const pose = useRef<CarPose>({ doors: 0, hood: 0, spin: 0, lights: 0 }) as MutableRefObject<CarPose>;
  const pointer = useRef(new THREE.Vector2());
  const look = useMemo(() => new THREE.Vector3(), []);
  const { camera, size } = useThree();

  useEffect(() => {
    const move = (e: PointerEvent) => pointer.current.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, []);

  useFrame((_, dt) => {
    const g = car.current;
    if (!g) return;
    const s = story;
    g.rotation.y = s.yaw;
    // heading of the nose (+z in model space) after yaw: (sin θ, 0, cos θ)
    g.position.set(Math.sin(s.yaw) * s.drive, s.lift, Math.cos(s.yaw) * s.drive);
    // wheels roll with distance travelled (r ≈ 0.36 m) on top of the story's own spin
    const p = pose.current;
    p.doors = s.doors;
    p.hood = s.hood;
    p.lights = s.lights;
    p.spin = s.spin + s.drive / 0.36;

    // frame a 5.4 m car: further away on tall/narrow stages so it always fits the width
    const aspect = size.width / size.height;
    const fit = 6.4 / (aspect * 0.53); // 0.53 ≈ 2·tan(15°)
    const dist = Math.max(8.2, fit) * (1 - s.zoom * 0.22);
    const k = 1 - Math.pow(0.0015, dt);
    const tx = pointer.current.x * 0.7;
    const ty = 1.9 - pointer.current.y * 0.3 - s.zoom * 0.5;
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (dist - camera.position.z) * k;
    look.set(0, 0.35, 0);
    camera.lookAt(look);
  });

  return (
    <group ref={car}>
      <RealCar paint={paint} pose={pose} />
      {/* the shadow travels with the car */} {/* taste-skill-ignore: 3D ground contact shadow */}
      <SoftShadow /> {/* taste-skill-ignore: 3D ground contact shadow */}
    </group>
  );
}

/**
 * The car's stage. Transparent canvas laid over the giant plate in the DOM, so the motif stays
 * crisp CSS and the car casts its soft shadow onto it. Stops rendering when off-screen. (taste-skill-ignore: 3D ground contact shadow)
 */
export default function CarStage({ paint, onReady }: { paint: PaintId; onReady?: () => void }) {
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
    <div ref={wrap} className="stage-canvas" aria-hidden="true">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, phone ? 1.5 : 2]}
        camera={{ position: [0, 1.9, 11], fov: 30, near: 0.1, far: 60 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.AgXToneMapping }}
        onCreated={() => onReady?.()}
      >
        <Suspense fallback={null}>
          <WhiteStudio shadow={false} /> {/* taste-skill-ignore: 3D ground contact shadow */}
          <Rig paint={paint} />
        </Suspense>
      </Canvas>
    </div>
  );
}
