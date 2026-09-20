import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Mood } from "../lib/personality";

export interface CatProps {
  name: "oreo" | "biscuit";
  mood: Mood;
  position?: [number, number, number];
  rotationY?: number;
  hostile?: boolean;
  scale?: number;
}

const BLACK = "#161616";
const WHITE = "#f5f3ee";
const PINK = "#e8a1ab";

function buildTailCurve() {
  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.15, -0.35),
    new THREE.Vector3(0.05, 0.55, -0.55),
    new THREE.Vector3(0.2, 0.95, -0.45),
    new THREE.Vector3(0.4, 1.15, -0.15),
    new THREE.Vector3(0.5, 1.1, 0.15),
  ];
  return new THREE.CatmullRomCurve3(points);
}

function subCurve(curve: THREE.CatmullRomCurve3, from: number, to: number, samples = 24) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = from + ((to - from) * i) / samples;
    pts.push(curve.getPoint(t));
  }
  return new THREE.CatmullRomCurve3(pts);
}

export default function Cat({ name, mood, position = [0, 0, 0], rotationY = 0, hostile = false, scale = 1 }: CatProps) {
  const group = useRef<THREE.Group>(null);
  const headGroup = useRef<THREE.Group>(null);
  const tailGroup = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const bodyMesh = useRef<THREE.Mesh>(null);

  const tailCurve = useMemo(buildTailCurve, []);
  const blackTailCurve = useMemo(() => subCurve(tailCurve, 0, 0.82), [tailCurve]);
  const whiteTailCurve = useMemo(() => subCurve(tailCurve, 0.76, 1), [tailCurve]);
  const tailTipPoint = useMemo(() => tailCurve.getPoint(1), [tailCurve]);

  const blink = useRef(0);
  const nextBlinkAt = useRef(1 + Math.random() * 3);
  const t0 = useRef(Math.random() * 100);

  const eyeColor = hostile ? "#b3231c" : name === "oreo" ? "#c7d94a" : "#7fb8c9";

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime + t0.current;
    const isThis = mood === "biscuit" ? name === "biscuit" : name === "oreo";

    // Idle breathing bob for whichever cat is "active" in the scene
    if (group.current) {
      const bobSpeed = mood === "excited" && isThis ? 6 : mood === "alert" && isThis ? 4 : 1.6;
      const bobAmount = mood === "excited" && isThis ? 0.05 : 0.02;
      group.current.position.y = position[1] + Math.sin(t * bobSpeed) * bobAmount;

      const targetScale = mood === "excited" && isThis ? scale * 1.06 : scale;
      group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
    }

    // Head tilt for sulking / alert
    if (headGroup.current) {
      const targetX =
        mood === "sulking" && isThis ? 0.35 : mood === "alert" && isThis ? -0.15 : 0.05;
      headGroup.current.rotation.x = THREE.MathUtils.lerp(headGroup.current.rotation.x, targetX, delta * 4);
      headGroup.current.rotation.y = Math.sin(t * 0.5) * 0.06;
    }

    // Ears: pinned back if hostile/sulking, perked if alert/excited
    const earTarget = hostile || (mood === "sulking" && isThis) ? 0.9 : mood === "alert" && isThis ? -0.15 : 0.25;
    if (earL.current) earL.current.rotation.z = THREE.MathUtils.lerp(earL.current.rotation.z, -0.5 - earTarget, delta * 5);
    if (earR.current) earR.current.rotation.z = THREE.MathUtils.lerp(earR.current.rotation.z, 0.5 + earTarget, delta * 5);

    // Blinking
    blink.current -= delta;
    if (blink.current <= 0 && nextBlinkAt.current <= 0) {
      blink.current = 0.12;
      nextBlinkAt.current = 2 + Math.random() * 3;
    }
    nextBlinkAt.current -= delta;
    const blinking = blink.current > 0;
    const eyeScaleY = blinking ? 0.08 : mood === "excited" && isThis ? 1.3 : mood === "alert" && isThis ? 1.25 : 1;
    if (eyeL.current) eyeL.current.scale.y = THREE.MathUtils.lerp(eyeL.current.scale.y, eyeScaleY, delta * 10);
    if (eyeR.current) eyeR.current.scale.y = THREE.MathUtils.lerp(eyeR.current.scale.y, eyeScaleY, delta * 10);

    // Tail swish
    if (tailGroup.current) {
      const swishSpeed = mood === "excited" && isThis ? 9 : mood === "alert" && isThis || hostile ? 12 : 2.2;
      const swishAmount = mood === "sulking" && isThis ? 0.05 : hostile ? 0.35 : 0.25;
      tailGroup.current.rotation.y = Math.sin(t * swishSpeed) * swishAmount;
      const tailLift = mood === "sulking" && isThis ? -0.3 : mood === "alert" && isThis ? 0.15 : 0;
      tailGroup.current.rotation.x = THREE.MathUtils.lerp(tailGroup.current.rotation.x, tailLift, delta * 4);
      const puffTarget = hostile ? 1.35 : 1;
      tailGroup.current.scale.x = THREE.MathUtils.lerp(tailGroup.current.scale.x, puffTarget, delta * 5);
      tailGroup.current.scale.z = THREE.MathUtils.lerp(tailGroup.current.scale.z, puffTarget, delta * 5);
    }

    if (bodyMesh.current) {
      const breathe = 1 + Math.sin(t * (mood === "excited" && isThis ? 5 : 1.8)) * 0.015;
      bodyMesh.current.scale.y = breathe;
    }
  });

  return (
    <group ref={group} position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Body */}
      <mesh ref={bodyMesh} position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.62, 24, 20]} />
        <meshStandardMaterial color={BLACK} roughness={0.75} />
      </mesh>
      {/* Belly / chest patch */}
      <mesh position={[0, 0.4, 0.5]} scale={[0.55, 0.6, 0.4]} castShadow>
        <sphereGeometry args={[0.45, 20, 16]} />
        <meshStandardMaterial color={WHITE} roughness={0.85} />
      </mesh>

      {/* Legs */}
      {[
        [-0.33, 0.62],
        [0.33, 0.62],
        [-0.33, -0.15],
        [0.33, -0.15],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.18, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.36, 10]} />
            <meshStandardMaterial color={BLACK} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.135, 0.13, 0.12, 10]} />
            <meshStandardMaterial color={WHITE} roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Head */}
      <group ref={headGroup} position={[0, 0.95, 0.62]}>
        <mesh castShadow>
          <sphereGeometry args={[0.4, 22, 18]} />
          <meshStandardMaterial color={BLACK} roughness={0.7} />
        </mesh>
        {/* Muzzle patch */}
        <mesh position={[0, -0.12, 0.28]} scale={[0.62, 0.5, 0.55]}>
          <sphereGeometry args={[0.28, 18, 14]} />
          <meshStandardMaterial color={WHITE} roughness={0.85} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.02, 0.42]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color={PINK} roughness={0.5} />
        </mesh>

        {/* Eyes */}
        <mesh ref={eyeL} position={[-0.16, 0.05, 0.33]}>
          <sphereGeometry args={[0.075, 12, 10]} />
          <meshStandardMaterial color={eyeColor} emissive={hostile ? "#5c0f0a" : "#000000"} emissiveIntensity={hostile ? 0.35 : 0} />
        </mesh>
        <mesh position={[-0.16, 0.05, 0.395]}>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        <mesh ref={eyeR} position={[0.16, 0.05, 0.33]}>
          <sphereGeometry args={[0.075, 12, 10]} />
          <meshStandardMaterial color={eyeColor} emissive={hostile ? "#5c0f0a" : "#000000"} emissiveIntensity={hostile ? 0.35 : 0} />
        </mesh>
        <mesh position={[0.16, 0.05, 0.395]}>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>

        {/* Ears */}
        <group ref={earL} position={[-0.24, 0.32, -0.02]} rotation={[0, 0, -0.5]}>
          <mesh castShadow>
            <coneGeometry args={[0.16, 0.3, 4]} />
            <meshStandardMaterial color={BLACK} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.02, 0.05]} scale={[0.55, 0.55, 0.4]}>
            <coneGeometry args={[0.16, 0.3, 4]} />
            <meshStandardMaterial color={PINK} roughness={0.6} />
          </mesh>
        </group>
        <group ref={earR} position={[0.24, 0.32, -0.02]} rotation={[0, 0, 0.5]}>
          <mesh castShadow>
            <coneGeometry args={[0.16, 0.3, 4]} />
            <meshStandardMaterial color={BLACK} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.02, 0.05]} scale={[0.55, 0.55, 0.4]}>
            <coneGeometry args={[0.16, 0.3, 4]} />
            <meshStandardMaterial color={PINK} roughness={0.6} />
          </mesh>
        </group>

        {/* Whiskers */}
        {[-1, 1].map((side) =>
          [-0.05, 0, 0.05].map((yOff, i) => (
            <mesh
              key={`${side}-${i}`}
              position={[side * 0.32, -0.02 + yOff, 0.3]}
              rotation={[0, side * 0.35, Math.PI / 2 + yOff * 1.5]}
            >
              <cylinderGeometry args={[0.004, 0.004, 0.34, 4]} />
              <meshStandardMaterial color="#e5e2da" />
            </mesh>
          )),
        )}
      </group>

      {/* Tail */}
      <group ref={tailGroup} position={[0, 0.55, -0.55]}>
        <mesh castShadow>
          <tubeGeometry args={[blackTailCurve, 20, 0.09, 8, false]} />
          <meshStandardMaterial color={BLACK} roughness={0.75} />
        </mesh>
        <mesh castShadow>
          <tubeGeometry args={[whiteTailCurve, 12, 0.075, 8, false]} />
          <meshStandardMaterial color={WHITE} roughness={0.85} />
        </mesh>
        <mesh position={tailTipPoint} castShadow>
          <sphereGeometry args={[0.075, 10, 8]} />
          <meshStandardMaterial color={WHITE} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}
