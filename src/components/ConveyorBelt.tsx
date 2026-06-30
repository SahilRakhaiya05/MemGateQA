interface EvidenceLike {
  id: string;
  title: string;
  sensitivity: string;
}

interface ConveyorBeltProps {
  evidence: EvidenceLike[];
  running: boolean;
  activeIndex?: number;
}

export function ConveyorBelt({ evidence, running, activeIndex = 0 }: ConveyorBeltProps) {
  const packets = evidence.slice(0, 6);

  return (
    <div className="relative">
      <div className="belt">
        <div className={`tread ${running ? '' : 'paused slow'}`} />
        <div className="rail top" />
        <div className="rail bot" />
        {packets.map((item, index) => {
          const isPrivate = item.sensitivity === 'private' || item.sensitivity === 'secret';
          const delay = index * 1.35;
          const duration = 7 + index * 0.4;
          return (
            <div
              key={item.id}
              className={`evidence-packet ${isPrivate ? 'private' : ''}`}
              style={{
                left: `${8 + index * 14}%`,
                animation: running
                  ? `slidePacket ${duration}s linear ${delay}s infinite`
                  : undefined,
                opacity: index === activeIndex ? 1 : 0.75,
                zIndex: index === activeIndex ? 10 : 1,
              }}
              title={item.title}
            >
              <div className="body">
                <div className="tape" />
                <div className="label" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-hud text-[10px] uppercase tracking-[0.2em] text-slate-500">
        <span>Intake</span>
        <span className={running ? 'text-cyan-glow' : 'text-slate-600'}>
          {running ? '● CONVEYOR LIVE' : '○ STANDBY'}
        </span>
        <span>Indexed</span>
      </div>
      <style>{`
        @keyframes slidePacket {
          0% { left: -12%; }
          100% { left: 92%; }
        }
      `}</style>
    </div>
  );
}