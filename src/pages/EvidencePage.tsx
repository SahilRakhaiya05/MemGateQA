import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api/memgateqaApi';
import { ConveyorBelt } from '../components/ConveyorBelt';
import type { CaseOutletContext } from './CaseLayout';

export function EvidencePage() {
  const { caseData, reload } = useOutletContext<CaseOutletContext>();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    title: '',
    body: '',
    kind: 'manual',
    sensitivity: 'internal',
    source: 'user-input',
    shouldRemember: true,
  });

  const addEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addEvidence(caseData.id, { ...form, date: new Date().toISOString().slice(0, 10), risk: '', shouldForget: false });
    setForm({ title: '', body: '', kind: 'manual', sensitivity: 'internal', source: 'user-input', shouldRemember: true });
    reload();
  };

  const remember = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await api.remember(caseData.id);
      setMsg(`Indexed ${res.stored.length} items to Cognee dataset "${res.dataset}"`);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Remember failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await api.deleteEvidence(caseData.id, id);
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="ent-card p-5">
        <h2 className="font-sig text-lg font-bold text-white">Evidence intake</h2>
        <p className="mt-1 text-sm text-slate-400">Upload corpus for this audit. Conveyor shows packets queued for Cognee.</p>
        <div className="mt-4">
          <ConveyorBelt evidence={caseData.evidence as never[]} running={caseData.status === 'intake' || busy} />
        </div>
        <button className="ent-btn ent-btn-primary mt-4" disabled={busy || !caseData.evidence.length} onClick={remember} type="button">
          {busy ? 'Writing to Cognee…' : `remember() — push ${caseData.evidence.filter((e) => e.shouldRemember).length} items`}
        </button>
        {msg ? <p className="mt-2 font-hud text-sm text-emerald-300">{msg}</p> : null}
      </div>

      <div className="ent-card p-5">
        <h2 className="font-sig text-lg font-bold text-white">Add evidence document</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={addEvidence}>
          <input className="ent-input" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="ent-input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="meeting">Meeting note</option>
            <option value="decision">Decision</option>
            <option value="trace">Agent trace</option>
            <option value="private">Private note</option>
            <option value="policy">Policy</option>
            <option value="manual">Manual</option>
          </select>
          <textarea className="ent-input sm:col-span-2" placeholder="Evidence content…" required rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <select className="ent-input" value={form.sensitivity} onChange={(e) => setForm({ ...form, sensitivity: e.target.value })}>
            <option value="internal">Internal</option>
            <option value="private">Private</option>
            <option value="secret">Secret</option>
            <option value="public">Public</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input checked={form.shouldRemember} onChange={(e) => setForm({ ...form, shouldRemember: e.target.checked })} type="checkbox" />
            Include in remember()
          </label>
          <button className="ent-btn ent-btn-secondary sm:col-span-2" type="submit">Add evidence</button>
        </form>
      </div>

      <section className="space-y-2">
        {caseData.evidence.map((ev) => (
          <div key={ev.id} className="ent-case-row py-4">
            <div>
              <div className="font-bold text-white">{ev.title}</div>
              <div className="font-hud text-[10px] text-slate-500">{ev.kind} · {ev.sensitivity} · {ev.date}</div>
              <p className="mt-2 text-sm text-slate-400">{ev.body}</p>
            </div>
            <button className="ent-btn ent-btn-ghost ent-btn-sm shrink-0" onClick={() => remove(ev.id)} type="button">Remove</button>
          </div>
        ))}
      </section>
    </div>
  );
}