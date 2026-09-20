import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BODY = "#3c3a48";
const WING = "#dbe9ff";
const EYE = "#c23d3d";

export default function FlyAvatar({
  wingSpeedRef,
  alertRef,
  position = [0.9, -0.55, 1.5] as [number, number, number],
}: {
  /** 0..1 ref, read each frame — drives wing-flap rate from VNC motor activity. */
  wingSpeedRef: React.MutableRefObject<number>;
  /** 0..1 ref, read each frame — >0.5 triggers the escape flinch. */
  alertRef: React.MutableRefObject<number>;
  position?: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const flinchT = useRef(0);
  const wasAlert = useRef(false);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const speed = 8 + wingSpeedRef.current * 55;
    const flap = Math.sin(t * speed) * 0.9;
    if (wingL.current) wingL.current.rotation.z = 0.15 + flap * 0.5;
    if (wingR.current) wingR.current.rotation.z = -0.15 - flap * 0.5;

    const alert = alertRef.current > 0.5;
    if (alert && !wasAlert.current) flinchT.current = 0.4;
    wasAlert.current = alert;
    flinchT.current = Math.max(0, flinchT.current - delta);

    if (group.current) {
      const jitter = flinchT.current > 0 ? Math.sin(t * 60) * 0.05 * (flinchT.current / 0.4) : 0;
      group.current.position.set(position[0] + jitter, position[1] + Math.sin(t * 1.4) * 0.04, position[2]);
      const scaleBump = 1 + (flinchT.current > 0 ? flinchT.current * 0.5 : 0);
      group.current.scale.setScalar(0.85 * scaleBump);
      group.current.rotation.y = Math.sin(t * 0.5) * 0.3 + (flinchT.current > 0 ? flinchT.current * 2 : 0);
    }
  });

  return (
    <group ref={group} position={position} scale={0.85}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.16, 14, 12]} />
        <meshStandardMaterial color={BODY} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, -0.16]} scale={[0.85, 0.85, 1.3]}>
        <sphereGeometry args={[0.13, 12, 10]} />
        <meshStandardMaterial color={BODY} roughness={0.5} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.09, 0.03, 0.1]}>
        <sphereGeometry args={[0.075, 10, 8]} />
        <meshStandardMaterial color={EYE} emissive={EYE} emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0.09, 0.03, 0.1]}>
        <sphereGeometry args={[0.075, 10, 8]} />
        <meshStandardMaterial color={EYE} emissive={EYE} emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      {/* Wings */}
      <mesh ref={wingL} position={[-0.1, 0.08, -0.02]} rotation={[0.1, 0, 0.15]}>
        <planeGeometry args={[0.32, 0.14]} />
        <meshStandardMaterial color={WING} transparent opacity={0.35} side={THREE.DoubleSide} roughness={0.2} />
      </mesh>
      <mesh ref={wingR} position={[0.1, 0.08, -0.02]} rotation={[0.1, 0, -0.15]}>
        <planeGeometry args={[0.32, 0.14]} />
        <meshStandardMaterial color={WING} transparent opacity={0.35} side={THREE.DoubleSide} roughness={0.2} />
      </mesh>
      {/* Legs (just visual clutter, static) */}
      {[-1, 0, 1].map((i) => (
        <group key={i}>
          <mesh position={[-0.14, -0.08, i * 0.06]} rotation={[0, 0, 0.9]}>
            <cylinderGeometry args={[0.008, 0.008, 0.16, 5]} />
            <meshStandardMaterial color={BODY} />
          </mesh>
          <mesh position={[0.14, -0.08, i * 0.06]} rotation={[0, 0, -0.9]}>
            <cylinderGeometry args={[0.008, 0.008, 0.16, 5]} />
            <meshStandardMaterial color={BODY} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
