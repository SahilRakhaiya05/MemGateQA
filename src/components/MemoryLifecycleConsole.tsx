import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type CaseRecord } from '../api/memgateqaApi';
import { LIFECYCLE } from '../copy/brand';
import { CogneeOperationPanel } from './CogneeOperationPanel';
import { WikiQueryPanel } from './WikiQueryPanel';
import { useToast } from './Toast';

interface MemoryLifecycleConsoleProps {
  caseId: string;
}

type LifecycleMode = 'hub' | 'ask' | 'forget';

export function MemoryLifecycleConsole({ caseId }: MemoryLifecycleConsoleProps) {
  const { toast } = useToast();
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [mode, setMode] = useState<LifecycleMode>('hub');
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(() => {
    api.getCase(caseId).then(setCaseData).catch(() => setCaseData(null));
  }, [caseId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const forgetTargets = (caseData?.evidence ?? []).filter((ev) => ev.shouldForget);

  const fileIt = async () => {
    setBusy('remember');
    try {
      const res = await api.remember(caseId);
      toast(`Indexed ${res.stored.length} facts into Cognee`, 'success');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'remember() failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  const connectDots = async () => {
    setBusy('memify');
    try {
      await api.remember(caseId);
      await api.interrogate(caseId);
      toast('Graph enriched — memify() + trap check complete', 'success');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'memify() failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  const actions = [
    {
      id: 'remember',
      label: LIFECYCLE.fileIt,
      sub: LIFECYCLE.fileItSub,
      hint: 'remember() — index evidence into the graph',
      onClick: fileIt,
    },
    {
      id: 'recall',
      label: LIFECYCLE.askHal,
      sub: LIFECYCLE.askHalSub,
      hint: 'recall() — cited answers from memory',
      onClick: () => setMode('ask'),
    },
    {
      id: 'memify',
      label: LIFECYCLE.connectDots,
      sub: LIFECYCLE.connectDotsSub,
      hint: 'memify() — derive inference links',
      onClick: connectDots,
    },
    {
      id: 'forget',
      label: LIFECYCLE.purgeLies,
      sub: LIFECYCLE.purgeLiesSub,
      hint: 'forget() — remove red herrings & secrets',
      onClick: () => setMode('forget'),
    },
  ] as const;

  return (
    <section className="memory-lifecycle-console space-y-4">
      <header className="memory-lifecycle-head">
        <p className="font-hud text-[9px] uppercase tracking-wider text-cyan-300">{LIFECYCLE.kicker}</p>
        <h3 className="font-sig text-lg font-bold text-white">{LIFECYCLE.title}</h3>
        <p className="text-xs text-slate-500">{LIFECYCLE.sub}</p>
      </header>

      {mode === 'hub' ? (
        <div className="memory-lifecycle-grid">
          {actions.map((action) => (
            <button
              key={action.id}
              className="memory-lifecycle-card"
              disabled={busy !== null}
              onClick={action.onClick}
              title={action.hint}
              type="button"
            >
              <span className="memory-lifecycle-card-label">{action.label}</span>
              <span className="memory-lifecycle-card-sub">{action.sub}</span>
              {busy === action.id ? <span className="memory-lifecycle-busy">Running…</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'ask' ? (
        <div className="memory-lifecycle-panel ent-card p-4 space-y-3">
          <div className="memory-lifecycle-panel-head">
            <p className="font-hud text-[10px] uppercase text-amber-300">{LIFECYCLE.askHal}</p>
            <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={() => setMode('hub')} type="button">
              ← Back
            </button>
          </div>
          <WikiQueryPanel caseId={caseId} />
        </div>
      ) : null}

      {mode === 'forget' ? (
        <div className="memory-lifecycle-panel ent-card p-4 space-y-3">
          <div className="memory-lifecycle-panel-head">
            <p className="font-hud text-[10px] uppercase text-rose-300">{LIFECYCLE.purgeLies}</p>
            <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={() => setMode('hub')} type="button">
              ← Back
            </button>
          </div>
          {forgetTargets.length === 0 ? (
            <p className="text-sm text-slate-400">No forget-marked evidence in this case.</p>
          ) : (
            <ul className="memory-lifecycle-forget-list">
              {forgetTargets.map((ev) => (
                <li key={ev.id} className="memory-lifecycle-forget-item">
                  <span className="memory-lifecycle-forget-badge">{ev.sensitivity}</span>
                  <div>
                    <p className="memory-lifecycle-forget-title">{ev.title}</p>
                    <p className="memory-lifecycle-forget-body">{ev.body?.slice(0, 120)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Link className="ent-btn ent-btn-primary ent-btn-sm" to={`/cases/${caseId}/surgery`}>
              Run forget() in surgery
            </Link>
            <Link className="ent-btn ent-btn-secondary ent-btn-sm" to={`/cases/${caseId}/tests`}>
              Verify with trap suite
            </Link>
          </div>
        </div>
      ) : null}

      <CogneeOperationPanel caseId={caseId} compact collapsible />
    </section>
  );

}