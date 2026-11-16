import { Environment, Lightformer } from "@react-three/drei";

/**
 * Offline studio lighting for car paint: a dark room with long softbox strips that draw the
 * classic highlight lines along the body. Rendered once into a cube map (no network, no HDRI file).
 */
export function StudioEnv({ warm = "#ffd9a8" }: { warm?: string }) {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#050506"]} />
      {/* overhead strip softboxes */}
      <Lightformer form="rect" intensity={2.4} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[12, 1.2, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[0, 5, -2.4]} rotation-x={Math.PI / 2} scale={[12, 0.6, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[0, 5, 2.4]} rotation-x={Math.PI / 2} scale={[12, 0.6, 1]} />
      {/* side panels give the flank its reflection line */}
      <Lightformer form="rect" intensity={2.6} position={[0, 1.2, 7]} target={[0, 1, 0]} scale={[16, 0.9, 1]} />
      <Lightformer form="rect" intensity={0.9} position={[0, 3.2, 6]} target={[0, 0.5, 0]} scale={[16, 2.4, 1]} />
      <Lightformer form="rect" intensity={0.8} position={[0, 1.4, -7]} rotation-y={Math.PI} scale={[14, 1.4, 1]} />
      {/* warm accent kicker */}
      <Lightformer form="ring" color={warm} intensity={3} position={[-6, 2, 3]} scale={2.5} target={[0, 0, 0]} />
      <Lightformer form="rect" color="#9fb8ff" intensity={1.5} position={[7, 2, -2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
    </Environment>
  );
}
