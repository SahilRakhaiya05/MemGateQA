import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { FactoryScene } from './FactoryScene';
import { STATUS_TO_STATION_3D, STATIONS_3D, type Station3DId } from './theme';

interface Factory3DCanvasProps {
  status: string;
  running?: boolean;
  compact?: boolean;
  jammed?: boolean;
  className?: string;
}

export function statusToStation3D(status: string): Station3DId {
  return STATUS_TO_STATION_3D[status] ?? 'intake';
}

function SceneLoader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#00f5ff" wireframe />
    </mesh>
  );
}

export function Factory3DCanvas({ status, running = true, compact = false, jammed = false, className = '' }: Factory3DCanvasProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const activeStation = statusToStation3D(status);
  const activeIndex = STATIONS_3D.findIndex((s) => s.id === activeStation);
  const height = compact ? 220 : 380;

  if (reducedMotion) {
    return (
      <div className={`factory-3d-fallback ${className}`} style={{ height }}>
        <div className="factory-3d-fallback-grid">
          {STATIONS_3D.map((s, i) => (
            <div
              key={s.id}
              className={`factory-3d-fallback-station ${s.id === activeStation ? 'active' : ''} ${i < activeIndex ? 'done' : ''}`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`factory-3d-canvas-wrap ${compact ? 'compact' : ''} ${className}`} style={{ height }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
        style={{ background: 'transparent' }}
      >
        <PerspectiveCamera makeDefault fov={42} position={[0, 9, 16]} />
        <OrbitControls
          enablePan={false}
          enableZoom={!compact}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={12}
          maxDistance={28}
          minPolarAngle={Math.PI / 6}
          target={[0, 1, 0]}
        />
        <Suspense fallback={<SceneLoader />}>
          <FactoryScene activeIndex={activeIndex} activeStation={activeStation} jammed={jammed} running={running} />
        </Suspense>
      </Canvas>
      <div className="factory-3d-scanlines" />
      <div className="factory-3d-vignette" />
    </div>
  );
}