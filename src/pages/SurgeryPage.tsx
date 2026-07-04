import { useEffect, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { api } from '../api/memgateqaApi';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { CasePageShell } from '../components/case/CasePageShell';
import { GapFillPanel } from '../components/GapFillPanel';
import { SurgeryStation } from '../components/SurgeryStation';
import { useToast } from '../components/Toast';
import { celebrateClear } from '../lib/celebrate';
import type { CaseOutletContext } from './CaseLayout';

export function SurgeryPage() {
  const { caseData, reload, setArenaLive } = useOutletContext<CaseOutletContext>();
  const location = useLocation();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const agentPlan = (location.state as { plan?: string } | null)?.plan;
  const [instruction, setInstruction] = useState(
    agentPlan ??
      'Final architecture decision overrides stale memory. Refuse private tokens. Honor forget requests.',
  );

  const forgetIds = caseData.evidence.filter((e) => e.shouldForget).map((e) => e.id);
  const failures = (caseData.resultsBefore ?? []).filter((r) => r.status === 'fail');

  useEffect(() => {
    setArenaLive({ stress: busy ? 'strained' : failures.length > 2 ? 'drowning' : 'strained' });
  }, [busy, failures.length, setArenaLive]);

  const runSurgery = async () => {
    setBusy(true);
    setMsg('');
    try {
      await api.surgery(caseData.id, {
        dataset: caseData.dataset,
        instruction,
        evidenceIds: forgetIds,
      });
      const rerun = await api.rerun(caseData.id);
      const text = `Repair applied · Regression score: ${rerun.score}/100`;
      setMsg(text);
      toast(text, rerun.score >= 80 ? 'success' : 'info');
      if (rerun.score >= 80) celebrateClear();
      reload();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Repair failed';
      setMsg(errMsg);
      toast(errMsg, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <CasePageShell>
      {failures.length > 0 ? (
        <ArcadeMotionCard className="ent-card p-4" delay={0.02}>
          <p className="font-hud text-[10px] uppercase tracking-wider text-slate-500">Failures to repair</p>
          <ul className="mt-2 space-y-2">
            {failures.slice(0, 5).map((f) => {
              const test = caseData.tests.find((t) => t.id === f.testId);
              return (
                <li key={f.testId} className="case-failure-chip">
                  <span className="text-red-300">✗</span>
                  <span className="font-medium text-white">{test?.title ?? f.testId}</span>
                  <span className="text-xs text-slate-500 truncate">{f.reason}</span>
                </li>
              );
            })}
          </ul>
        </ArcadeMotionCard>
      ) : null}

      <GapFillPanel
        caseData={caseData}
        failures={failures}
        onApplyHint={(hint) => setInstruction((prev) => `${prev}\n\n${hint}`)}
      />

      <ArcadeMotionCard className="arena-action-panel" stamp>
        <SurgeryStation
          busy={busy}
          failures={failures.map((f) => ({ testId: f.testId, reason: f.reason }))}
          forgetIds={forgetIds}
          instruction={instruction}
          message={msg}
          onApprove={runSurgery}
          onInstructionChange={setInstruction}
        />
      </ArcadeMotionCard>
    </CasePageShell>
  );
}