import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api/memgateqaApi';
import type { CaseOutletContext } from './CaseLayout';

export function SurgeryPage() {
  const { caseData, reload } = useOutletContext<CaseOutletContext>();
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
      setMsg(`Repair applied · Regression score: ${rerun.score}/100`);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Repair failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ent-card p-6">
      <h2 className="font-sig text-lg font-bold text-white">Memory repair (human-approved)</h2>
      <p className="mt-1 text-sm text-slate-400">
        Enterprise gate: repairs require approval. Uses Cognee <code className="font-hud text-cyan-300">improve()</code> +{' '}
        <code className="font-hud text-cyan-300">forget()</code>, then auto-regression.
      </p>

      {failures.length ? (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="font-hud text-[10px] uppercase text-amber-300">{failures.length} gate failures</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {failures.map((f) => (
              <li key={f.testId}>• {f.reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="mt-4 block font-hud text-[10px] uppercase text-slate-500">Correction instruction</label>
      <textarea
        className="ent-input mt-1"
        onChange={(e) => setInstruction(e.target.value)}
        rows={3}
        value={instruction}
      />

      {forgetIds.length ? (
        <p className="mt-2 font-hud text-[10px] text-slate-500">forget() targets: {forgetIds.join(', ')}</p>
      ) : null}

      <button className="ent-btn ent-btn-primary mt-4" disabled={busy} onClick={runSurgery} type="button">
        {busy ? 'Applying…' : 'Approve repair & run regression'}
      </button>
      {msg ? <p className="mt-2 font-hud text-sm text-emerald-300">{msg}</p> : null}
    </div>
  );
}