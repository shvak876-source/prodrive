import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Body style of the procedural car. Same parts, different proportions. */
export type BodyType = "sedan" | "suv" | "coupe";

/** Live values the scene can mutate every frame without re-rendering React. */
export interface CarLive {
  /** Accumulated wheel rotation in radians. */
  wheelSpin: number;
  /** 0..1 headlight / tail-light intensity. */
  lights: number;
}

interface CarModelProps {
  color: string;
  type?: BodyType;
  /** Optional mutable state (from scroll) – read inside useFrame. */
  live?: MutableRefObject<CarLive>;
  /** Static light level when there is no live ref (catalog renders). */
  lights?: number;
}

/** Proportions per body style. */
const BODY: Record<BodyType, { ride: number; bodyY: number; cabinY: number; cabinX: number; wheel: number; width: number }> = {
  sedan: { ride: 0, bodyY: 1, cabinY: 1, cabinX: 1, wheel: 1.1, width: 1 },
  coupe: { ride: -0.02, bodyY: 0.92, cabinY: 0.8, cabinX: 0.92, wheel: 1.12, width: 1.03 },
  suv: { ride: 0.12, bodyY: 1.2, cabinY: 1.15, cabinX: 1.08, wheel: 1.2, width: 1.05 },
};

const WHEEL_X = 1.45;
const WHEEL_R = 0.36;
const ARCH_R = 0.47;
const ARCH_CY = 0.36;

/** Side profile of the lower body (x = length, y = height). Front of the car is +x. */
function bodyShape(): THREE.Shape {
  const s = new THREE.Shape();
  const floor = 0.22;
  const a = Math.asin((ARCH_CY - floor) / ARCH_R); // angle where the arch meets the sill
  const dx = ARCH_R * Math.cos(a);
  s.moveTo(2.05, floor);
  s.lineTo(WHEEL_X + dx, floor);
  s.absarc(WHEEL_X, ARCH_CY, ARCH_R, -a, Math.PI + a, false);
  s.lineTo(-WHEEL_X + dx, floor);
  s.absarc(-WHEEL_X, ARCH_CY, ARCH_R, -a, Math.PI + a, false);
  s.lineTo(-2.18, floor);
  s.quadraticCurveTo(-2.36, 0.3, -2.34, 0.62);
  s.quadraticCurveTo(-2.32, 0.96, -2.02, 1.02);
  s.lineTo(-1.5, 1.04);
  s.lineTo(1.1, 0.99);
  s.quadraticCurveTo(1.9, 0.92, 2.2, 0.76);
  s.quadraticCurveTo(2.4, 0.64, 2.38, 0.46);
  s.quadraticCurveTo(2.34, 0.24, 2.05, floor);
  return s;
}

/** Side profile of the glass greenhouse. */
function cabinShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-1.72, 0.96);
  s.quadraticCurveTo(-1.18, 1.18, -0.86, 1.38);
  s.quadraticCurveTo(-0.62, 1.48, -0.18, 1.49);
  s.lineTo(0.28, 1.47);
  s.quadraticCurveTo(0.56, 1.45, 0.78, 1.3);
  s.lineTo(1.42, 0.96);
  s.closePath();
  return s;
}

/** Extrudes a profile across the car's width and centres it on z. */
function extrude(shape: THREE.Shape, width: number, bevel: number, segments = 8): THREE.ExtrudeGeometry {
  const depth = width - bevel * 2;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.6,
    bevelSegments: segments,
    curveSegments: 48,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Bends the slab-like extrusions into a car: the nose and tail narrow in plan view and the
 * flanks lean inward toward the roof (tumblehome), so reflections curve instead of sitting flat.
 */
function sculpt(src: THREE.BufferGeometry, kind: "body" | "cabin") {
  // the flat side caps are a few huge triangles – split them so the bend is smooth,
  // then weld vertices so normals average across faces (no faceting)
  src.deleteAttribute("normal");
  src.deleteAttribute("uv");
  const g = mergeVertices(new TessellateModifier(0.09, 10).modify(src), 1e-4);
  src.dispose();
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);
    if (kind === "body") {
      z *= 1 - 0.16 * smooth(1.55, 2.45, Math.abs(x)); // tapered corners
      z *= 1 - 0.07 * smooth(0.55, 1.1, y); // shoulder rolls in
      z *= 1 + 0.025 * smooth(0.9, 0.3, Math.abs(y - 0.5)); // slight belly at the door
    } else {
      z *= 1 - 0.3 * smooth(0.95, 1.5, y); // glasshouse narrows toward the roof
      z *= 1 - 0.08 * smooth(0.6, 1.5, Math.abs(x + 0.4));
    }
    pos.setZ(i, z);
  }
  g.computeVertexNormals();
  return g;
}

/** Tyre cross-section revolved around the axle. */
function tyreGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  const w = 0.13;
  for (let i = 0; i <= 16; i++) {
    const t = (i / 16) * Math.PI;
    // rounded shoulder: radius bulges at the tread, pinches at the sidewalls
    pts.push(new THREE.Vector2(0.25 + Math.sin(t) * 0.11, -w + (i / 16) * w * 2));
  }
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateX(Math.PI / 2); // axle along z
  return g;
}

/**
 * Original stylised GT car built from extruded profiles: painted body, tinted glass greenhouse,
 * five-spoke wheels, LED light bars. ~25k triangles. All geometry is generated once and shared.
 */
export function CarModel({ color, type = "sedan", live, lights = 0 }: CarModelProps) {
  const p = BODY[type];
  const geo = useMemo(() => {
    const body = sculpt(extrude(bodyShape(), 1.86 * p.width, 0.13, 10), "body");
    const cabin = sculpt(extrude(cabinShape(), 1.56 * p.width, 0.22, 10), "cabin");
    const tyre = tyreGeometry();
    const rim = new THREE.CylinderGeometry(0.245, 0.245, 0.05, 40).rotateX(Math.PI / 2);
    const disc = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 32).rotateX(Math.PI / 2);
    const hub = new THREE.CylinderGeometry(0.05, 0.06, 0.06, 16).rotateX(Math.PI / 2);
    const spoke = new THREE.BoxGeometry(0.22, 0.075, 0.035);
    spoke.translate(0.11, 0, 0);
    return { body, cabin, tyre, rim, disc, hub, spoke };
  }, [p.width]);

  const mats = useMemo(() => {
    const paint = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.7,
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.4,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#07080a",
      metalness: 0.9,
      roughness: 0.05,
      clearcoat: 1,
      envMapIntensity: 1.6,
    });
    const trim = new THREE.MeshStandardMaterial({ color: "#0c0c0e", metalness: 0.4, roughness: 0.55 });
    const tyre = new THREE.MeshStandardMaterial({ color: "#121214", roughness: 0.85, metalness: 0 });
    const rim = new THREE.MeshStandardMaterial({ color: "#d4d7dc", metalness: 1, roughness: 0.18, envMapIntensity: 1.8 });
    const rimDark = new THREE.MeshStandardMaterial({ color: "#2a2b2f", metalness: 0.9, roughness: 0.35 });
    const head = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#e8f1ff", emissiveIntensity: 0.3, toneMapped: false });
    const tail = new THREE.MeshStandardMaterial({ color: "#3a0505", emissive: "#ff1a1a", emissiveIntensity: 0.4, toneMapped: false });
    return { paint, glass, trim, tyre, rim, rimDark, head, tail };
  }, [color]);

  const wheels = useRef<THREE.Group[]>([]);

  useFrame(() => {
    const spin = live ? live.current.wheelSpin : 0;
    const l = live ? live.current.lights : lights;
    for (const w of wheels.current) if (w) w.rotation.z = w.userData.flip ? spin : -spin;
    mats.head.emissiveIntensity = 0.35 + l * 5;
    mats.tail.emissiveIntensity = 0.5 + l * 4;
  });

  const halfW = 0.93 * p.width;
  const wheelZ = halfW - 0.12;
  const wheelPositions: [number, number][] = [
    [WHEEL_X, wheelZ],
    [WHEEL_X, -wheelZ],
    [-WHEEL_X, wheelZ],
    [-WHEEL_X, -wheelZ],
  ];

  return (
    <group position={[0, p.ride, 0]}>
      {/* body + glass scale vertically per body style; wheels stay round */}
      <group scale={[1, p.bodyY, 1]}>
        <mesh geometry={geo.body} material={mats.paint} castShadow receiveShadow />
        <group scale={[p.cabinX, p.cabinY, 1]} position={[0, 0.96 * (1 - p.cabinY), 0]}>
          <mesh geometry={geo.cabin} material={mats.glass} castShadow />
        </group>
        {/* front light bar + two LED blades */}
        {/* positions sit on the bevelled skin (profile + 0.128 bevel), tilted to the panel slope */}
        <mesh position={[2.39, 0.69, 0]} rotation={[0, 0, -0.62]} material={mats.head}>
          <boxGeometry args={[0.03, 0.03, 1.2 * p.width]} />
        </mesh>
        {/* lower intake */}
        <mesh position={[2.44, 0.4, 0]} rotation={[0, 0, 0.25]} material={mats.trim}>
          <boxGeometry args={[0.05, 0.14, 1.0 * p.width]} />
        </mesh>
        {/* full-width tail light */}
        <mesh position={[-2.4, 0.86, 0]} rotation={[0, 0, 0.5]} material={mats.tail}>
          <boxGeometry args={[0.03, 0.045, 1.4 * p.width]} />
        </mesh>
        {/* dark sills between the arches and a thin chrome line under the side windows */}
        {[1, -1].map((sd) => (
          <group key={sd}>
            <mesh position={[0, 0.3, sd * (halfW + 0.005)]} material={mats.trim}>
              <boxGeometry args={[1.95, 0.1, 0.04]} />
            </mesh>
            <mesh position={[-0.2, 1.005, sd * (halfW - 0.1)]} material={mats.rim}>
              <boxGeometry args={[2.7, 0.018, 0.02]} />
            </mesh>
          </group>
        ))}
        {/* mirrors */}
        {[1, -1].map((sd) => (
          <mesh key={sd} position={[0.62, 1.1, sd * (halfW - 0.04)]} rotation={[0, 0, -0.2]} material={mats.trim}>
            <boxGeometry args={[0.14, 0.07, 0.12]} />
          </mesh>
        ))}
      </group>

      {wheelPositions.map(([x, z], i) => (
        <group key={i} position={[x, WHEEL_R * p.wheel, z]} scale={p.wheel}>
          <group ref={(g) => { if (g) wheels.current[i] = g; }} rotation={[0, z < 0 ? Math.PI : 0, 0]} userData={{ flip: z < 0 }}>
            <mesh geometry={geo.tyre} material={mats.tyre} castShadow />
            <mesh geometry={geo.disc} material={mats.rimDark} position={[0, 0, -0.04]} />
            <mesh geometry={geo.rim} material={mats.rimDark} position={[0, 0, 0.02]} scale={[1, 1, 0.4]} />
            {Array.from({ length: 5 }, (_, k) => (
              <mesh key={k} geometry={geo.spoke} material={mats.rim} rotation={[0, 0, (k / 5) * Math.PI * 2]} position={[0, 0, 0.07]} />
            ))}
            <mesh geometry={geo.hub} material={mats.rim} position={[0, 0, 0.08]} />
          </group>
        </group>
      ))}
    </group>
  );
}
