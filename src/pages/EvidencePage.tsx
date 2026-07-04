import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api/memgateqaApi';
import { ArenaBelt } from '../components/arcade/ArenaBelt';
import { ArcadeCabinet } from '../components/arcade/ArcadeCabinet';
import { CogneeBridgeChip } from '../components/CogneeBridgeChip';
import { EvidenceDossier } from '../components/EvidenceDossier';
import { useToast } from '../components/Toast';
import type { CaseOutletContext } from './CaseLayout';

export function EvidencePage() {
  const { caseData, reload } = useOutletContext<CaseOutletContext>();
  const { toast } = useToast();
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

  const dataIds = caseData.cogneeDataIds ?? {};
  const rememberCount = caseData.evidence.filter((e) => e.shouldRemember).length;
  const indexedCount = caseData.evidence.filter((e) => dataIds[e.id]).length;

  const addEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addEvidence(caseData.id, {
        ...form,
        date: new Date().toISOString().slice(0, 10),
        risk: '',
        shouldForget: false,
      });
      setForm({ title: '', body: '', kind: 'manual', sensitivity: 'internal', source: 'user-input', shouldRemember: true });
      toast('Evidence added to belt', 'success');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add evidence', 'error');
    }
  };

  const remember = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await api.remember(caseData.id);
      const text = `Indexed ${res.stored.length} items → Cognee "${res.dataset}"`;
      setMsg(text);
      toast(text, 'success');
      reload();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Remember failed';
      setMsg(errMsg);
      toast(errMsg, 'error');
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
      <ArcadeCabinet compact subtitle="Manila packets · remember() to Cognee" title="EVIDENCE INTAKE">
        <CogneeBridgeChip
          dataset={caseData.dataset}
          indexed={indexedCount}
          pending={rememberCount - indexedCount}
        />

        <ArenaBelt
          fast={busy}
          label="Sortation belt"
          packets={caseData.evidence.map((e) => ({
            id: e.id,
            title: e.title,
            private: e.sensitivity === 'private' || e.sensitivity === 'secret',
            indexed: Boolean(dataIds[e.id]),
          }))}
          running={busy || caseData.evidence.length > 0}
        />

        <button
          className="ent-btn ent-btn-primary mt-4 w-full"
          disabled={busy || !rememberCount}
          onClick={remember}
          type="button"
        >
          {busy ? 'Writing to Cognee…' : `remember() — push ${rememberCount} items`}
        </button>
        {msg ? <p className="mt-2 font-hud text-sm text-emerald-300">{msg}</p> : null}
      </ArcadeCabinet>

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

      <section>
        <h2 className="mb-4 font-sig text-lg font-bold text-white">Evidence dossier</h2>
        <EvidenceDossier indexedIds={dataIds} items={caseData.evidence} onRemove={remove} />
      </section>
    </div>
  );
}