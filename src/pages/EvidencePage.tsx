import { useEffect, useState } from 'react';
import { api } from '../api/memgateqaApi';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { GoButton } from '../components/arcade/GoButton';
import { CasePageShell } from '../components/case/CasePageShell';
import { AgentIngestPanel } from '../components/AgentIngestPanel';
import { EvidenceDossier } from '../components/EvidenceDossier';
import { MemoryGraphPanel } from '../components/MemoryGraphPanel';
import { useToast } from '../components/Toast';
import { useCaseWorkspace } from '../context/CaseWorkspaceContext';

export function EvidencePage() {
  const { caseData, reload, setArenaLive } = useCaseWorkspace();
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
  const indexPct = caseData.evidence.length
    ? Math.round((indexedCount / caseData.evidence.length) * 100)
    : 0;

  useEffect(() => {
    setArenaLive({ beltFast: busy, stress: busy ? 'focused' : 'calm' });
  }, [busy, setArenaLive]);

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
    <CasePageShell
      actions={
        <div className="flex flex-wrap items-center gap-4">
          <GoButton disabled={busy || !rememberCount} label={busy ? '…' : 'Index Evidence'} loading={busy} onClick={remember} />
          <span className="font-hud text-[10px] uppercase text-slate-500">{rememberCount} items · remember()</span>
        </div>
      }
    >
      {caseData.evidence.length > 0 ? (
        <ArcadeMotionCard className="ent-card p-4" delay={0.02}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-hud text-[10px] uppercase tracking-wider text-slate-500">Cognee index progress</span>
            <span className="font-hud text-sm text-theme-accent">{indexedCount}/{caseData.evidence.length} indexed</span>
          </div>
          <div className="case-index-bar mt-2">
            <div className="case-index-bar-fill" style={{ width: `${indexPct}%` }} />
          </div>
        </ArcadeMotionCard>
      ) : null}

      {msg ? (
        <p className="font-hud text-sm text-emerald-300">{msg}</p>
      ) : null}

      <ArcadeMotionCard className="ent-card p-5" delay={0.04}>
        <AgentIngestPanel
          onIngest={async (_summary, chunks) => {
            for (const c of chunks) {
              await api.addEvidence(caseData.id, {
                title: c.title,
                body: c.body,
                kind: 'import',
                sensitivity: c.sensitivity ?? 'internal',
                source: c.source ?? 'ingest',
                shouldRemember: true,
                shouldForget: false,
                date: new Date().toISOString().slice(0, 10),
                risk: '',
              });
            }
            toast(`Added ${chunks.length} imported facts`, 'success');
            reload();
          }}
        />
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-5" delay={0.05}>
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
          <button className="ent-btn ent-btn-secondary sm:col-span-2" type="submit">Add to belt</button>
        </form>
      </ArcadeMotionCard>

      <section>
        <h2 className="mb-4 font-sig text-lg font-bold text-white">Evidence dossier</h2>
        <EvidenceDossier indexedIds={dataIds} items={caseData.evidence} onRemove={remove} />
      </section>

      {indexedCount > 0 ? (
        <ArcadeMotionCard className="ent-card p-4" delay={0.08}>
          <MemoryGraphPanel caseId={caseData.id} evidence={caseData.evidence} />
        </ArcadeMotionCard>
      ) : null}
    </CasePageShell>
  );
}