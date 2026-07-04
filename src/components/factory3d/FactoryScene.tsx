import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { FACTORY_COLORS, STATIONS_3D, type Station3DId } from './theme';

interface FactorySceneProps {
  activeStation: Station3DId;
  activeIndex: number;
  running: boolean;
  jammed?: boolean;
}

function AnimatedBelt({ running, jammed }: { running: boolean; jammed?: boolean }) {
  const beltRef = useRef<THREE.Mesh>(null);
  const offset = useRef(0);

  useFrame((_, delta) => {
    if (!beltRef.current) return;
    const speed = jammed ? 0.15 : running ? 0.8 : 0;
    offset.current += delta * speed;
    const mat = beltRef.current.material as THREE.MeshStandardMaterial;
    if (mat.map) mat.map.offset.x = offset.current % 1;
  });

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = FACTORY_COLORS.belt;
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#3a4555';
    for (let i = 0; i < 16; i++) ctx.fillRect(i * 16, 18, 10, 28);
    ctx.strokeStyle = jammed ? FACTORY_COLORS.overflowAmber : FACTORY_COLORS.cerebrasOrange;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 1);
    return tex;
  }, [jammed]);

  return (
    <group>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 3]} />
        <meshStandardMaterial color="#1a2030" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh ref={beltRef} position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 2.2]} />
        <meshStandardMaterial map={texture} color={FACTORY_COLORS.conveyor} metalness={0.65} roughness={0.3} />
      </mesh>
      {[-13, 13].map((x) => (
        <mesh key={x} position={[x, 0.35, 0]}>
          <boxGeometry args={[0.3, 0.5, 2.8]} />
          <meshStandardMaterial color={FACTORY_COLORS.metalLight} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function MovingPackages({ running, jammed }: { running: boolean; jammed?: boolean }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const positions = useRef([0, 3, 6, 9, 12, 15, 18, 21]);
  const speed = jammed ? 0.4 : 2.5;

  useFrame((_, delta) => {
    if (!running) return;
    positions.current = positions.current.map((p) => (p + delta * speed) % 24);
    refs.current.forEach((mesh, i) => {
      if (mesh) mesh.position.set(positions.current[i] - 12, 0.55, 0);
    });
  });

  const colors = [FACTORY_COLORS.manila, '#d4b896', FACTORY_COLORS.neonCyan, '#c97a7a', FACTORY_COLORS.challengerBlue, FACTORY_COLORS.clearedGreen, FACTORY_COLORS.neonGold, FACTORY_COLORS.manila];

  return (
    <group>
      {colors.map((color, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) refs.current[i] = el; }}
          position={[i * 3 - 12, 0.55, 0]}
        >
          <boxGeometry args={[0.65, 0.45, 0.45]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={running ? 0.12 : 0.03} metalness={0.2} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function StationMachine({ x, color, isActive, isDone }: { x: number; color: string; isActive: boolean; isDone: boolean }) {
  const glowRef = useRef<THREE.PointLight>(null);
  const armRef = useRef<THREE.Mesh>(null);
  const pressRef = useRef<THREE.Mesh>(null);
  const pulse = useRef(0);

  useFrame((_, delta) => {
    pulse.current += delta * (isActive ? 5 : 1);
    if (glowRef.current) glowRef.current.intensity = isActive ? 2.5 + Math.sin(pulse.current) : isDone ? 0.7 : 0.12;
    if (armRef.current && isActive) armRef.current.rotation.z = Math.sin(pulse.current * 2.5) * 0.35;
    if (pressRef.current && isActive) pressRef.current.position.y = 1.5 + Math.sin(pulse.current * 3) * 0.08;
  });

  const emissive = isActive ? color : isDone ? FACTORY_COLORS.clearedGreen : '#252d3a';
  const intensity = isActive ? 1 : isDone ? 0.4 : 0.04;

  return (
    <group position={[x, 0, -1.2]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.7, 2]} />
        <meshStandardMaterial color={FACTORY_COLORS.metal} metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2.2, 1.4, 1.8]} />
        <meshStandardMaterial color="#1f2734" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.85, 0.2]}>
        <boxGeometry args={[2, 0.35, 1.5]} />
        <meshStandardMaterial color={emissive} emissive={emissive} emissiveIntensity={intensity} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh ref={pressRef} position={[0, 1.5, 0.6]}>
        <cylinderGeometry args={[0.35, 0.4, 0.5, 12]} />
        <meshStandardMaterial color={FACTORY_COLORS.metalLight} metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh ref={armRef} position={[0.9, 2.1, 0.5]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.12, 1, 0.12]} />
        <meshStandardMaterial color="#8899aa" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0.9, 2.7, 0.5]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 1.5 : 0.15} />
      </mesh>
      <pointLight ref={glowRef} color={color} distance={6} position={[0, 2.5, 1.2]} />
      {isActive ? <Sparkles count={40} color={color} position={[0, 2, 0]} scale={[3, 2.5, 2]} size={4} speed={0.5} /> : null}
      {isActive ? <Sparkles count={15} color="#ffffff" position={[0, 1.8, 0.5]} scale={[1.5, 1, 1]} size={2} speed={0.8} /> : null}
    </group>
  );
}

function FactoryRobot({ targetX, active, stress }: { targetX: number; active: boolean; stress: number }) {
  const group = useRef<THREE.Group>(null);
  const currentX = useRef(targetX);
  const bounce = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    currentX.current = THREE.MathUtils.lerp(currentX.current, targetX, delta * 2.5);
    bounce.current += delta * (active ? 7 : 2);
    const shake = stress > 2 ? Math.sin(bounce.current * 8) * 0.05 : 0;
    const y = 0.55 + (active ? Math.abs(Math.sin(bounce.current)) * 0.3 : 0) + shake;
    group.current.position.set(currentX.current, y, 1.4);
    group.current.rotation.y = Math.sin(bounce.current * 0.5) * 0.12;
    group.current.rotation.z = shake;
  });

  const bodyColor = stress > 2 ? FACTORY_COLORS.danger : stress > 1 ? FACTORY_COLORS.overflowAmber : FACTORY_COLORS.challengerBlue;

  return (
    <group ref={group}>
      <Float floatIntensity={active ? 0.5 : 0.1} rotationIntensity={0.15} speed={active ? 5 : 1}>
        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.28, 0.55, 6, 14]} />
          <meshStandardMaterial color={bodyColor} emissive={bodyColor} emissiveIntensity={active ? 0.5 : 0.15} metalness={0.75} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshStandardMaterial color={FACTORY_COLORS.metalLight} metalness={0.9} roughness={0.12} />
        </mesh>
        <mesh position={[0.1, 0.68, 0.18]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={active ? FACTORY_COLORS.clearedGreen : FACTORY_COLORS.danger} emissive={active ? FACTORY_COLORS.clearedGreen : FACTORY_COLORS.danger} emissiveIntensity={2} />
        </mesh>
        <mesh position={[-0.1, 0.68, 0.18]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={active ? FACTORY_COLORS.clearedGreen : FACTORY_COLORS.danger} emissive={active ? FACTORY_COLORS.clearedGreen : FACTORY_COLORS.danger} emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.35, 0.2, 0]}>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <meshStandardMaterial color={FACTORY_COLORS.cerebrasOrange} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.35, 0.2, 0]}>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <meshStandardMaterial color={FACTORY_COLORS.cerebrasOrange} metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
}

function CeilingLights() {
  return (
    <>
      {[-8, 0, 8].map((x) => (
        <group key={x} position={[x, 5.5, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.15, 0.4, 8]} />
            <meshStandardMaterial color={FACTORY_COLORS.metal} metalness={0.9} roughness={0.1} />
          </mesh>
          <pointLight color={x === 0 ? FACTORY_COLORS.cerebrasOrange : FACTORY_COLORS.neonCyan} distance={12} intensity={0.6} position={[0, -0.3, 0]} />
          <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.5, 16]} />
            <meshBasicMaterial color={x === 0 ? FACTORY_COLORS.cerebrasOrange : FACTORY_COLORS.neonCyan} opacity={0.4} side={THREE.DoubleSide} transparent />
          </mesh>
        </group>
      ))}
    </>
  );
}

function SteamVent({ x }: { x: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) ref.current.position.y = 0.5 + Math.sin(s.clock.elapsedTime * 2 + x) * 0.1;
  });
  return (
    <group ref={ref} position={[x, 0.5, -2]}>
      <Sparkles color="#aaaaaa" count={12} opacity={0.25} position={[0, 1, 0]} scale={[1, 2, 1]} size={2} speed={0.3} />
    </group>
  );
}

function ReflectiveFloor() {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[40, 16]} />
      <MeshReflectorMaterial
        blur={[280, 120]}
        color={FACTORY_COLORS.floor}
        depthScale={0.6}
        metalness={0.5}
        mirror={0.35}
        mixBlur={1}
        mixStrength={0.4}
        roughness={0.65}
      />
    </mesh>
  );
}

export function FactoryScene({ activeStation, activeIndex, running, jammed }: FactorySceneProps) {
  const activeData = STATIONS_3D.find((s) => s.id === activeStation)!;
  const stress = jammed ? 3 : activeIndex > 2 ? 1 : 0;

  return (
    <>
      <fog attach="fog" args={[FACTORY_COLORS.void, 16, 42]} />
      <ambientLight intensity={0.2} />
      <directionalLight castShadow intensity={1.4} position={[6, 14, 8]} shadow-mapSize={[2048, 2048]} />
      <hemisphereLight args={['#3C7BF2', '#0d1118', 0.35]} />

      <ReflectiveFloor />
      <gridHelper args={[40, 40, FACTORY_COLORS.cerebrasOrange, FACTORY_COLORS.floorGrid]} position={[0, 0.03, 0]} />

      <CeilingLights />
      <SteamVent x={-6} />
      <SteamVent x={6} />

      <AnimatedBelt jammed={jammed} running={running} />
      <MovingPackages jammed={jammed} running={running} />

      {STATIONS_3D.map((station, idx) => (
        <StationMachine
          key={station.id}
          color={station.color}
          isActive={station.id === activeStation}
          isDone={idx < activeIndex}
          x={station.x}
        />
      ))}

      <FactoryRobot active={running} stress={stress} targetX={activeData.x} />

      <Sparkles color={FACTORY_COLORS.neonCyan} count={100} opacity={0.2} position={[0, 3.5, -2]} scale={35} size={1.2} speed={0.15} />
    </>
  );
}