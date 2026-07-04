import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArcadeCabinet } from '../components/arcade/ArcadeCabinet';
import { CaseTemplates } from '../components/enterprise/CaseTemplates';
import { api } from '../api/memgateqaApi';

const STEPS = ['Choose template', 'Configure audit', 'Add evidence'] as const;

export function NewCasePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
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
    <div className="mx-auto max-w-3xl">
      <Link className="breadcrumb-link" to="/">
        ← Dashboard
      </Link>

      <ArcadeCabinet className="mt-4" subtitle="Configure agent · dataset · risk profile" title="NEW AUDIT STATION">
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 12 }}>
        <p className="text-sm text-slate-400">
          Create a production QA case for your Cognee agent. Define evidence, trap tests, and export a ship proof.
        </p>
      </motion.div>

      <div className="wizard-steps mt-8">
        {STEPS.map((s, i) => (
          <div key={s} className={`wizard-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <span className="wizard-step-num">{i < step ? '✓' : i + 1}</span>
            <span className="wizard-step-label">{s}</span>
            {i < STEPS.length - 1 ? <div className="wizard-connector" /> : null}
          </div>
        ))}
      </div>

      <motion.div
        animate={{ opacity: 1 }}
        className="mt-8"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CaseTemplates
          onSelect={(t) => {
            setForm({
              name: t.name,
              agent: t.agent,
              dataset: t.dataset,
              description: t.description,
            });
            setStep(1);
          }}
        />
      </motion.div>

      <form className="ent-card wizard-form mt-8 space-y-4 p-6" onSubmit={submit}>
        <h2 className="font-sig text-lg font-bold text-white">Audit configuration</h2>
        <Field
          label="Audit name"
          onChange={(v) => { setForm({ ...form, name: v }); setStep(Math.max(step, 1)); }}
          placeholder="Customer Support Memory Audit Q3"
          required
          value={form.name}
        />
        <Field
          label="Agent name"
          onChange={(v) => setForm({ ...form, agent: v })}
          placeholder="Support Bot v2"
          required
          value={form.agent}
        />
        <Field
          label="Cognee dataset"
          onChange={(v) => setForm({ ...form, dataset: v })}
          placeholder="memgateqa_support_audit"
          required
          value={form.dataset}
        />
        <div>
          <label className="font-hud text-[10px] uppercase tracking-wider text-slate-500">Risk description</label>
          <textarea
            className="ent-input mt-1"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            onFocus={() => setStep(2)}
            placeholder="What memory failures are you testing? (privacy, forget, stale data…)"
            rows={3}
            value={form.description}
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button className="ent-btn ent-btn-primary w-full" disabled={busy} type="submit">
          {busy ? 'Creating…' : 'Create audit & add evidence →'}
        </button>
      </form>
      </ArcadeCabinet>
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