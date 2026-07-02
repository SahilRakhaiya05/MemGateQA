import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api/memgateqaApi';
import { DemoChips } from '../components/DemoChips';
import type { CaseOutletContext } from './CaseLayout';

const CATEGORIES = ['stale', 'contradiction', 'unsupported', 'privacy', 'forget', 'premise'];

export function TestsPage() {
  const { caseData, reload } = useOutletContext<CaseOutletContext>();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
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
    reload();
  };

  const interrogate = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await api.interrogate(caseData.id);
      const failed = res.results.filter((r) => r.status === 'fail').length;
      setMsg(`Interrogation complete · Health ${res.score}/100 · ${failed} gate failures`);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Interrogation failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await api.deleteTest(caseData.id, id);
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="ent-card p-5">
        <h2 className="font-sig text-lg font-bold text-white">Automated interrogation</h2>
        <p className="mt-1 text-sm text-slate-400">
          Runs live <code className="font-hud text-cyan-300">recall()</code> per trap test. Failures block ship until repair.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="ent-btn ent-btn-primary" disabled={busy || !caseData.tests.length} onClick={interrogate} type="button">
            {busy ? 'Running…' : `Run ${caseData.tests.length} trap tests`}
          </button>
          <DemoChips disabled={busy} onRunAll={interrogate} />
        </div>
        {msg ? <p className="mt-3 font-hud text-sm text-emerald-300">{msg}</p> : null}
      </div>

      <div className="ent-card p-5">
        <h2 className="font-sig text-lg font-bold text-white">Add trap test</h2>
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
      </div>

      <section className="space-y-2">
        {caseData.tests.map((t) => (
          <div key={t.id} className="ent-case-row py-4">
            <div>
              <span className="rounded-full border border-white/10 px-2 py-0.5 font-hud text-[10px] uppercase">{t.category}</span>
              <div className="mt-2 font-bold text-white">{t.title}</div>
              <p className="mt-1 text-sm text-cyan-100">Q: {t.question}</p>
              <p className="mt-1 text-sm text-slate-400">Expected: {t.expected}</p>
            </div>
            <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={() => remove(t.id)} type="button">Remove</button>
          </div>
        ))}
      </section>
    </div>
  );
}