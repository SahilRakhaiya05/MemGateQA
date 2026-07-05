import { useState } from 'react';
import { api, type CaseRecord } from '../api/memgateqaApi';
import { GoButton } from './arcade/GoButton';
import { HealthScoreGauge } from './HealthScoreGauge';
import { useToast } from './Toast';

interface AutoMemoryAuditProps {
  caseData: CaseRecord;
  onComplete?: () => void;
}

/** One-click Cognee memory audit — index, trap recall, AI repair, certify. No MCP/SDK required. */
export function AutoMemoryAudit({ caseData, onComplete }: AutoMemoryAuditProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');

  const before = caseData.resultsBefore ?? [];
  const after = caseData.resultsAfter ?? [];
  const report = caseData.reports?.[0] as { scoreBefore?: number } | undefined;
  const scoreBefore =
    report?.scoreBefore ??
    (after.length && before.length
      ? Math.round(before.reduce((s, r) => s + r.beforeScore, 0) / before.length)
      : null);
  const score = caseData.lastScore ?? 0;
  const failures = before.filter((r) => r.status === 'fail').length;
  const shipReady = score >= 80;

  const runAudit = async () => {
    setBusy(true);
    setPhase('Indexing evidence into Cognee…');
    try {
      const res = await api.runAutonomousGate(caseData.id, {
        forceReindex: false,
        startWatch: true,
        autoCertify: true,
        maxRepairCycles: 3,
      });
      toast(
        res.shipReady ? `Memory audit complete · ${res.health}% · ship clear` : `Audit done · ${res.health ?? '—'}%`,
        res.shipReady ? 'success' : 'info',
      );
      onComplete?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Audit failed', 'error');
    } finally {
      setBusy(false);
      setPhase('');
    }
  };

  return (
    <section className="auto-memory-audit">
      <div className="auto-memory-audit-top">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Cognee memory QA</p>
          <h2 className="font-sig text-xl font-bold text-white">Automatic memory audit</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            One action runs the full pipeline on your Cognee dataset: remember() → recall() trap tests → AI repair →
            health certificate. Uses Cognee graph search, privacy scopes, and forget() verification.
          </p>
        </div>
        <HealthScoreGauge before={scoreBefore} breakdown={caseData.lastBreakdown} score={score} size="sm" />
      </div>

      <div className="auto-memory-audit-stats">
        <Stat label="Evidence" value={String(caseData.evidence.length)} />
        <Stat label="Trap tests" value={String(caseData.tests.length)} />
        <Stat label="Failures" value={String(failures)} warn={failures > 0} />
        <Stat label="Status" value={shipReady ? 'Ship clear' : score > 0 ? 'Needs repair' : 'Not run'} ok={shipReady} />
      </div>

      <div className="auto-memory-audit-action">
        <GoButton disabled={busy || !caseData.tests.length} label={busy ? 'Running…' : 'Run memory audit'} loading={busy} onClick={runAudit} />
        {busy && phase ? <p className="text-sm text-slate-400">{phase}</p> : null}
        {!caseData.tests.length ? (
          <p className="text-sm text-amber-300">Add trap tests before running an audit.</p>
        ) : null}
      </div>
    </section>
  );
}

function Stat({ label, value, warn, ok }: { label: string; value: string; warn?: boolean; ok?: boolean }) {
  return (
    <div className="auto-memory-audit-stat">
      <span className="auto-memory-audit-stat-label">{label}</span>
      <span className={`auto-memory-audit-stat-value ${warn ? 'warn' : ok ? 'ok' : ''}`}>{value}</span>
    </div>
  );
}