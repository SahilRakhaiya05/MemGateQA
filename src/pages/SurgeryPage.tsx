import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/memgateqaApi';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { CasePageShell } from '../components/case/CasePageShell';
import { AiRepairPlanPanel } from '../components/AiRepairPlanPanel';
import { GapFillPanel } from '../components/GapFillPanel';
import { RbacSurgeryGate } from '../components/RbacSurgeryGate';
import { SurgeryStation } from '../components/SurgeryStation';
import { useToast } from '../components/Toast';
import { celebrateClear } from '../lib/celebrate';
import { useCaseWorkspace } from '../context/CaseWorkspaceContext';

export function SurgeryPage() {
  const { caseData, reload, setArenaLive } = useCaseWorkspace();
  const location = useLocation();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [actorRole, setActorRole] = useState<'owner' | 'reviewer'>('owner');
  const [msg, setMsg] = useState('');
  const agentPlan = (location.state as { plan?: string } | null)?.plan;
  const defaultInstruction =
    'Final architecture decision overrides stale memory. Refuse private tokens. Honor forget requests.';
  const [instruction, setInstruction] = useState(agentPlan ?? caseData.pendingRepairPlan ?? defaultInstruction);

  useEffect(() => {
    if (agentPlan) return;
    if (caseData.pendingRepairPlan) {
      setInstruction(caseData.pendingRepairPlan);
    }
  }, [agentPlan, caseData.pendingRepairPlan]);

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
        actorRole,
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
      <section className="ent-card p-4 border border-amber-400/25 bg-amber-400/5">
        <p className="font-hud text-[10px] uppercase tracking-wider text-amber-300">Human-in-the-loop gate</p>
        <h2 className="font-sig text-lg font-bold text-white">You approve every repair</h2>
        <p className="mt-1 text-sm text-slate-400">
          You approve every change before <code className="text-cyan-300">improve()</code> and{' '}
          <code className="text-cyan-300">forget()</code> update Cognee memory — full audit trail in the operation log.
        </p>
      </section>

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

      <AiRepairPlanPanel onApply={setInstruction} plan={caseData.pendingRepairPlan} />

      <GapFillPanel
        caseData={caseData}
        failures={failures}
        onApplyHint={(hint) => setInstruction((prev) => `${prev}\n\n${hint}`)}
      />

      <RbacSurgeryGate forgetCount={forgetIds.length} onRoleChange={setActorRole} role={actorRole} />

      <ArcadeMotionCard className="arena-action-panel" stamp>
        <SurgeryStation
          actorRole={actorRole}
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