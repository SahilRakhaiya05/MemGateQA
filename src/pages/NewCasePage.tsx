import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaseTemplates } from '../components/enterprise/CaseTemplates';
import { api } from '../api/memgateqaApi';

export function NewCasePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    agent: '',
    dataset: 'memgateqa_audit',
    description: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const created = await api.createCase(form);
      navigate(`/cases/${created.id}/evidence`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-sig text-3xl font-bold text-white">New memory audit</h1>
      <p className="mt-2 text-sm text-slate-400">
        Create a production QA case for your Cognee agent. Define evidence, trap tests, and export a ship proof.
      </p>

      <div className="mt-8">
        <CaseTemplates
          onSelect={(t) =>
            setForm({
              name: t.name,
              agent: t.agent,
              dataset: t.dataset,
              description: t.description,
            })
          }
        />
      </div>

      <form className="ent-card mt-8 space-y-4 p-6" onSubmit={submit}>
        <Field label="Audit name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="Customer Support Memory Audit Q3" />
        <Field label="Agent name" value={form.agent} onChange={(v) => setForm({ ...form, agent: v })} required placeholder="Support Bot v2" />
        <Field label="Cognee dataset" value={form.dataset} onChange={(v) => setForm({ ...form, dataset: v })} required placeholder="memgateqa_support_audit" />
        <div>
          <label className="font-hud text-[10px] uppercase tracking-wider text-slate-500">Risk description</label>
          <textarea
            className="ent-input mt-1"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What memory failures are you testing? (privacy, forget, stale data…)"
            rows={3}
            value={form.description}
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button className="ent-btn ent-btn-primary w-full" disabled={busy} type="submit">
          {busy ? 'Creating…' : 'Create audit & add evidence'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="font-hud text-[10px] uppercase tracking-wider text-slate-500">{label}</label>
      <input
        className="ent-input mt-1"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </div>
  );
}