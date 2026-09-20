import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { NODES, EDGES, GROUP_COLOR } from "./connectome";
import { BrainSimulation } from "./simulation";
import FlyAvatar from "./FlyAvatar";
import type { Motion } from "./useCameraMotion";

const tmpColor = new THREE.Color();

function Nodes({ sim }: { sim: BrainSimulation }) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const materials = useMemo(
    () => NODES.map((n) => new THREE.MeshStandardMaterial({ color: GROUP_COLOR[n.group], emissive: GROUP_COLOR[n.group], emissiveIntensity: 0.2, roughness: 0.4 })),
    [],
  );

  useFrame(() => {
    for (let i = 0; i < NODES.length; i++) {
      const a = sim.activity[i];
      const mat = materials[i];
      mat.emissiveIntensity = 0.15 + a * 1.6;
      tmpColor.set(GROUP_COLOR[NODES[i].group]);
      mat.color.copy(tmpColor).lerp(new THREE.Color("#ffffff"), a * 0.5);
      const mesh = meshRefs.current[i];
      if (mesh) {
        const s = 1 + a * 0.6;
        mesh.scale.setScalar(s);
      }
    }
  });

  return (
    <>
      {NODES.map((n, i) => (
        <mesh
          key={n.id}
          ref={(m) => {
            meshRefs.current[i] = m;
          }}
          position={n.position}
          material={materials[i]}
        >
          <sphereGeometry args={[n.radius, 14, 12]} />
        </mesh>
      ))}
    </>
  );
}

function Edges({ sim }: { sim: BrainSimulation }) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const { positions, colorAttr, pairs } = useMemo(() => {
    const positions = new Float32Array(EDGES.length * 6);
    const colorAttr = new Float32Array(EDGES.length * 6);
    const idx = new Map(NODES.map((n, i) => [n.id, i]));
    const pairs = EDGES.map((e) => [idx.get(e.source)!, idx.get(e.target)!] as [number, number]);
    EDGES.forEach((e, i) => {
      const a = NODES[idx.get(e.source)!];
      const b = NODES[idx.get(e.target)!];
      positions.set(a.position, i * 6);
      positions.set(b.position, i * 6 + 3);
    });
    return { positions, colorAttr, pairs };
  }, []);

  useFrame(() => {
    const geo = lineRef.current?.geometry;
    if (!geo) return;
    const colors = geo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < pairs.length; i++) {
      const [s, t] = pairs[i];
      const level = Math.min(1, (sim.activity[s] + sim.activity[t]) * 0.6);
      const g = NODES[t].group;
      tmpColor.set(GROUP_COLOR[g]).multiplyScalar(0.3 + level * 1.4);
      colors.setXYZ(i * 2, tmpColor.r, tmpColor.g, tmpColor.b);
      colors.setXYZ(i * 2 + 1, tmpColor.r, tmpColor.g, tmpColor.b);
    }
    colors.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorAttr, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.55} />
    </lineSegments>
  );
}

function SimDriver({
  sim,
  motionRef,
  wingSpeedRef,
  alertRef,
  onEscape,
}: {
  sim: BrainSimulation;
  motionRef: React.MutableRefObject<Motion>;
  wingSpeedRef: React.MutableRefObject<number>;
  alertRef: React.MutableRefObject<number>;
  onEscape: () => void;
}) {
  const cooldown = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    const m = motionRef.current;
    sim.step(dt, {
      lamina_L: m.left * 0.9,
      lamina_R: m.right * 0.9,
      al_L: 0.015,
      al_R: 0.015,
    });

    const vnc = sim.get("vnc");
    wingSpeedRef.current = vnc;
    alertRef.current = vnc;

    cooldown.current -= dt;
    if (vnc > 0.55 && cooldown.current <= 0) {
      cooldown.current = 1.2;
      onEscape();
    }
  });
  return null;
}

export default function BrainScene({
  sim,
  motionRef,
  onEscape,
}: {
  sim: BrainSimulation;
  motionRef: React.MutableRefObject<Motion>;
  onEscape: () => void;
}) {
  const wingSpeedRef = useRef(0);
  const alertRef = useRef(0);

  return (
    <Canvas camera={{ position: [2.6, 1.1, 3.4], fov: 38 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#0c0c14"]} />
      <fog attach="fog" args={["#0c0c14", 4.5, 10]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 3, 2]} intensity={0.9} />
      <directionalLight position={[-2, 1, -2]} intensity={0.3} color="#8fa6ff" />

      <Suspense fallback={null}>
        <Edges sim={sim} />
        <Nodes sim={sim} />
        <FlyAvatar wingSpeedRef={wingSpeedRef} alertRef={alertRef} />
        <SimDriver sim={sim} motionRef={motionRef} wingSpeedRef={wingSpeedRef} alertRef={alertRef} onEscape={onEscape} />
      </Suspense>

      <OrbitControls
        target={[0, -0.1, 0]}
        enablePan={false}
        minDistance={2.2}
        maxDistance={5.5}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}
