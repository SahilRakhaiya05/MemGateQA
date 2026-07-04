import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api/memgateqaApi';
import { DemoChips } from '../components/DemoChips';

import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { GoButton } from '../components/arcade/GoButton';
import { TrapCategoryGuide } from '../components/TrapCategoryGuide';
import { TrapTestCards } from '../components/TrapTestCards';
import { useToast } from '../components/Toast';
import { playFail, playThwack } from '../audio/sfx';
import { celebrateClear, celebrateShip } from '../lib/celebrate';
import type { CaseOutletContext } from './CaseLayout';

const CATEGORIES = ['stale', 'contradiction', 'unsupported', 'privacy', 'forget', 'premise'];

export function TestsPage() {
  const { caseData, reload, setArenaLive } = useOutletContext<CaseOutletContext>();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setArenaLive({ stress: busy ? 'focused' : undefined });
  }, [busy, setArenaLive]);
  const [form, setForm] = useState({
    title: '',
    question: '',
    expected: '',
    category: 'stale',
    severity: 'medium',
  });

  const addTest = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addTest(caseData.id, { ...form, evidenceIds: [], repairAction: 'improve', weight: 0.15, trap: '' });
    setForm({ title: '', question: '', expected: '', category: 'stale', severity: 'medium' });
    toast('Trap test added', 'success');
    reload();
  };

  const interrogate = async () => {
    setBusy(true);
    try {
      const res = await api.interrogate(caseData.id);
      const failed = res.results.filter((r) => r.status === 'fail').length;
      if (res.score >= 80) {
        playThwack();
        celebrateShip();
      } else if (failed === 0) {
        celebrateClear();
      } else {
        playFail();
      }
      toast(`Interrogation complete · Health ${res.score}/100 · ${failed} failures`, failed ? 'error' : 'success');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Interrogation failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await api.deleteTest(caseData.id, id);
    reload();
  };

  const categoryCounts = caseData.tests.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <TrapCategoryGuide activeCount={categoryCounts} />

      <ArcadeMotionCard className="arena-action-panel" stamp>
        <p className="font-hud text-[10px] uppercase tracking-wider text-slate-500">Interrogation room</p>
        <p className="mt-2 text-sm text-slate-300">
          Runs live <code className="font-hud text-cyan-300">recall()</code> per trap test. Failures pin to the suspect wall.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <GoButton
            disabled={busy || !caseData.tests.length}
            label={busy ? '…' : 'GO'}
            loading={busy}
            onClick={interrogate}
          />
          <span className="font-hud text-[10px] uppercase text-slate-500">
            Run {caseData.tests.length} traps
          </span>
          <DemoChips disabled={busy} onRunAll={interrogate} />
        </div>
      </ArcadeMotionCard>

      <TrapTestCards onRemove={remove} tests={caseData.tests} />

      <details className="ent-card p-5">
        <summary className="cursor-pointer font-sig text-lg font-bold text-white">+ Add custom trap test</summary>
        <form className="mt-4 grid gap-3" onSubmit={addTest}>
          <input className="ent-input" placeholder="Test name" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="ent-input" placeholder="Question to ask Cognee recall" required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          <textarea className="ent-input" placeholder="Expected behavior / answer" required rows={2} value={form.expected} onChange={(e) => setForm({ ...form, expected: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="ent-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select className="ent-input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <button className="ent-btn ent-btn-secondary" type="submit">Add test</button>
        </form>
      </details>
    </div>
  );
}