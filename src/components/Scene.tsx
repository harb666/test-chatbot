import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import Cat from "./Cat";
import type { Mood } from "../lib/personality";

export default function Scene({ mood }: { mood: Mood }) {
  const biscuitVisible = mood === "biscuit";

  return (
    <Canvas shadows camera={{ position: [2.1, 1.35, 3.3], fov: 36 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#12121a"]} />
      <fog attach="fog" args={["#12121a", 4, 9]} />
      {/* Lit entirely with local lights (no external HDRI) so the app stays fully
          self-contained and works offline once loaded. */}
      <ambientLight intensity={biscuitVisible ? 0.35 : 0.65} />
      <directionalLight
        position={[2, 3, 2]}
        intensity={biscuitVisible ? 0.7 : 1.3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-2, 1.5, -1]} intensity={0.35} color="#8fa6ff" />
      <pointLight position={[-1.5, 0.6, -1.5]} intensity={biscuitVisible ? 1.4 : 0.15} color={biscuitVisible ? "#b3231c" : "#ffffff"} />

      <Suspense fallback={null}>
        <Cat name="oreo" mood={mood} position={[0, 0, 0]} rotationY={0.35} />
        <Cat
          name="biscuit"
          mood={mood}
          position={[-1.15, 0, -1]}
          rotationY={-0.6}
          scale={0.92}
          hostile
        />
        <ContactShadows position={[0, -0.02, 0]} opacity={0.55} scale={5} blur={2.2} far={2} />
      </Suspense>

      <OrbitControls
        target={[0, 0.65, 0]}
        enablePan={false}
        minDistance={2.4}
        maxDistance={4.6}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 2.15}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}
