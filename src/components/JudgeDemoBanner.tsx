import { Link } from 'react-router-dom';
import { useCogneeBridge } from '../hooks/useCogneeBridge';

export function JudgeDemoBanner() {
  const { health } = useCogneeBridge();
  const live = health?.cognee_reachable;

  return (
    <div className={`judge-demo-banner ${live ? 'live' : 'offline'}`}>
      <div className="judge-demo-inner">
        <span className="judge-demo-pulse" />
        <div>
          <p className="judge-demo-kicker font-hud text-[9px] uppercase tracking-widest">
            {live ? 'Live Cognee Cloud' : 'Connect Cognee'}
          </p>
          <p className="judge-demo-title">
            {live
              ? 'Real tenant · full remember → trap → repair → certify'
              : 'Add Cognee API keys in Settings, run .\\start.ps1, then press GO on the belt'}
          </p>
        </div>
        <div className="judge-demo-actions">
          <Link className="ent-btn ent-btn-secondary ent-btn-sm" to="/cases/case-wolfpack/agent">
            RUN ALL
          </Link>
          <Link className="ent-btn ent-btn-ghost ent-btn-sm" to="/cases/case-wolfpack/report">
            Proof
          </Link>
        </div>
      </div>
    </div>
  );
}