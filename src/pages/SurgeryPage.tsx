import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api/memgateqaApi';
import { ArcadeCabinet } from '../components/arcade/ArcadeCabinet';
import { SurgeryStation } from '../components/SurgeryStation';
import { useToast } from '../components/Toast';
import { celebrateClear } from '../lib/celebrate';
import type { CaseOutletContext } from './CaseLayout';

export function SurgeryPage() {
  const { caseData, reload } = useOutletContext<CaseOutletContext>();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [instruction, setInstruction] = useState(
    'Final architecture decision overrides stale memory. Refuse private tokens. Honor forget requests.',
  );

  const forgetIds = caseData.evidence.filter((e) => e.shouldForget).map((e) => e.id);
  const failures = (caseData.resultsBefore ?? []).filter((r) => r.status === 'fail');

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
    <ArcadeCabinet compact subtitle={`${failures.length} failures · human-approved repair`} title="MEMORY SURGERY">
    <SurgeryStation
      busy={busy}
      failures={failures.map((f) => ({ testId: f.testId, reason: f.reason }))}
      forgetIds={forgetIds}
      instruction={instruction}
      message={msg}
      onApprove={runSurgery}
      onInstructionChange={setInstruction}
    />
    </ArcadeCabinet>
  );
}