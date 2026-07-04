import type { ReactNode } from 'react';

interface ArcadeCabinetProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}

export function ArcadeCabinet({ children, title, subtitle, compact, className = '' }: ArcadeCabinetProps) {
  return (
    <div className={`arcade-cabinet ${compact ? 'compact' : ''} ${className}`}>
      <div className="arcade-cabinet-chrome">
        <div className="arcade-marquee">
          <ArcadeLogo />
          {title ? (
            <div className="arcade-marquee-text">
              <span className="arcade-marquee-title">{title}</span>
              {subtitle ? <span className="arcade-marquee-sub">{subtitle}</span> : null}
            </div>
          ) : null}
          <div className="arcade-marquee-lights">
            {['#EF5A2A', '#00f5ff', '#22ff88', '#F5A623', '#b44dff'].map((c) => (
              <span key={c} className="arcade-light" style={{ '--light-color': c } as React.CSSProperties} />
            ))}
          </div>
        </div>
        <div className="arcade-bezel">
          <div className="arcade-screen">
            {children}
            <div className="arcade-scanlines" />
            <div className="arcade-vignette" />
          </div>
        </div>
        <div className="arcade-coin-slot">
          <span className="font-hud text-[8px] uppercase tracking-widest text-slate-600">MemGateQA · Memory gate inspection</span>
        </div>
      </div>
    </div>
  );
}

function ArcadeLogo() {
  return (
    <svg className="arcade-logo" viewBox="0 0 48 48" fill="none">
      <path d="M24 4L8 14v20l16 10 16-10V14L24 4z" fill="url(#logoGrad)" stroke="#EF5A2A" strokeWidth="1.5" />
      <path d="M24 12v12M18 18h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="30" r="3" fill="#00f5ff" />
      <defs>
        <linearGradient id="logoGrad" x1="8" y1="4" x2="40" y2="44">
          <stop stopColor="#1A1F2B" />
          <stop offset="1" stopColor="#141926" />
        </linearGradient>
      </defs>
    </svg>
  );
}