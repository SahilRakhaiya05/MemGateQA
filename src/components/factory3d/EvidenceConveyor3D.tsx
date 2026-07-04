import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FACTORY_COLORS } from './theme';

interface EvidenceConveyor3DProps {
  running: boolean;
  packetCount?: number;
  jammed?: boolean;
}

function MiniConveyor({ running, packetCount, jammed }: { running: boolean; packetCount: number; jammed?: boolean }) {
  const beltRef = useRef<THREE.Mesh>(null);
  const offset = useRef(0);
  const packetRefs = useRef<THREE.Mesh[]>([]);
  const positions = useRef(
    Array.from({ length: Math.min(Math.max(packetCount, 1), 5) }, (_, i) => i * 2 - 4),
  );

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#2c2c44';
    ctx.fillRect(0, 0, 128, 32);
    for (let i = 0; i < 8; i++) ctx.fillRect(i * 16, 8, 8, 16);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }, []);

  const beltSpeed = jammed ? 0.15 : 0.5;
  const packSpeed = jammed ? 0.35 : 1.8;

  useFrame((_, delta) => {
    if (beltRef.current) {
      const mat = beltRef.current.material as THREE.MeshStandardMaterial;
      if (running) offset.current += delta * beltSpeed;
      if (mat.map) mat.map.offset.x = offset.current;
    }
    if (running) {
      positions.current = positions.current.map((p) => ((p + delta * packSpeed) + 10) % 10 - 5);
      packetRefs.current.forEach((mesh, i) => {
        if (mesh) mesh.position.x = positions.current[i] ?? 0;
      });
    }
  });

  const colors = [FACTORY_COLORS.neonGold, FACTORY_COLORS.neonCyan, FACTORY_COLORS.danger, FACTORY_COLORS.neonPurple, FACTORY_COLORS.neonGreen];

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight color={FACTORY_COLORS.neonOrange} intensity={1.5} position={[0, 3, 2]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color={FACTORY_COLORS.floor} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh ref={beltRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <planeGeometry args={[10, 1.2]} />
        <meshStandardMaterial map={texture} color={FACTORY_COLORS.belt} metalness={0.6} roughness={0.3} />
      </mesh>
      {colors.slice(0, positions.current.length).map((color, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) packetRefs.current[i] = el; }}
          position={[positions.current[i], 0.35, 0]}
        >
          <boxGeometry args={[0.5, 0.35, 0.4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={running ? 0.4 : 0.1} />
        </mesh>
      ))}
      <mesh position={[-4.5, 0.5, -0.8]}>
        <boxGeometry args={[0.8, 1, 0.6]} />
        <meshStandardMaterial color={FACTORY_COLORS.metal} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[4.5, 0.5, -0.8]}>
        <boxGeometry args={[0.8, 1, 0.6]} />
        <meshStandardMaterial color={FACTORY_COLORS.metal} metalness={0.8} roughness={0.3} />
      </mesh>
    </>
  );
}

export function EvidenceConveyor3D({ running, packetCount = 3, jammed }: EvidenceConveyor3DProps) {
  return (
    <div className="evidence-3d-wrap">
      <Canvas dpr={[1, 1.25]} gl={{ antialias: true, alpha: true }} camera={{ position: [0, 4, 7], fov: 40 }}>
        <Suspense fallback={null}>
          <MiniConveyor jammed={jammed} packetCount={packetCount} running={running} />
        </Suspense>
      </Canvas>
      <div className="evidence-3d-overlay">
        <span className={running ? 'text-neon-orange' : 'text-slate-500'}>
          {running ? '● CONVEYOR LIVE' : '○ STANDBY'}
        </span>
      </div>
    </div>
  );
}