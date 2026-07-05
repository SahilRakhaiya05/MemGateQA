import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type WorkspaceSettings, type WorkspaceStatus } from '../api/memgateqaApi';
import { GoButton } from '../components/arcade/GoButton';
import { useToast } from '../components/Toast';

type Tab = 'cognee' | 'llm' | 'mcp' | 'gate' | 'webhooks';

const WEBHOOK_EVENTS = [
  { id: 'agent.publish', label: 'Agent published' },
  { id: 'gate.ship_clear', label: 'Ship gate cleared (≥80%)' },
] as const;

const LLM_PROVIDERS = [
  { id: 'openai', label: 'OpenAI', hint: 'OPENAI_API_KEY' },
  { id: 'gemini', label: 'Google AI', hint: 'GEMINI_API_KEY or GOOGLE_API_KEY' },
] as const;

export function SettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('cognee');
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState<'cognee' | 'llm' | 'webhook' | null>(null);
  const [mcpConfig, setMcpConfig] = useState('');
  const [loadError, setLoadError] = useState('');

  const rawProvider = settings?.llm.provider || status?.llmProvider || 'openai';
  const provider = rawProvider === 'mock' ? 'openai' : rawProvider;

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const res = await api.getSettings();
      setSettings(res.settings);
      setStatus(res.status);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not reach the MemGateQA bridge.');
      throw error;
    }
  }, []);

  useEffect(() => {
    load().catch((e) => toast(e.message, 'error'));
    api.mcpConfig().then((c) => setMcpConfig(JSON.stringify(c, null, 2))).catch(() => {});
  }, [load, toast]);

  useEffect(() => {
    if (!provider) {
      setModels([]);
      return;
    }
    api.listLlmModels(provider).then(setModels).catch(() => setModels([]));
  }, [provider]);

  const patch = (section: keyof WorkspaceSettings, key: string, value: unknown) => {
    setSettings((s) => (s ? { ...s, [section]: { ...s[section], [key]: value } } : s));
  };

  const save = async () => {
    if (!settings) return;
    setBusy(true);
    try {
      await api.saveSettings(settings);
      await load();
      toast('Settings saved — Cognee + LLM reconnected', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const testCognee = async () => {
    if (!settings) return;
    setTesting('cognee');
    try {
      const res = await api.testCognee({
        baseUrl: settings.cognee.baseUrl,
        apiKey: settings.cognee.apiKey?.includes('…') ? undefined : settings.cognee.apiKey,
        sessionId: settings.cognee.sessionId,
      });
      toast(
        res.ok ? `Cognee connected · ${res.datasetCount ?? 0} datasets` : res.error ?? 'Connection failed',
        res.ok ? 'success' : 'error',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test failed', 'error');
    } finally {
      setTesting(null);
    }
  };

  const testWebhook = async () => {
    setTesting('webhook');
    try {
      const res = await api.testWebhook('agent.publish', { test: true, source: 'settings' });
      const msg = res.skipped
        ? `Webhook skipped: ${res.reason ?? 'disabled'}`
        : res.ok
          ? `Webhook delivered (${res.status ?? 200})`
          : res.error ?? `Webhook failed (${res.status ?? 'error'})`;
      toast(msg, res.ok && !res.skipped ? 'success' : 'error');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Webhook test failed', 'error');
    } finally {
      setTesting(null);
    }
  };

  const testLlm = async () => {
    if (!settings) return;
    setTesting('llm');
    try {
      const model =
        settings.llm.model ||
        (provider === 'openai' ? settings.llm.openaiModel : settings.llm.geminiModel);
      const res = await api.testLlm({ provider, model });
      toast(res.ok ? `${res.provider} · ${res.model} OK` : res.error ?? 'LLM test failed', res.ok ? 'success' : 'error');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test failed', 'error');
    } finally {
      setTesting(null);
    }
  };

  if (!settings && loadError) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Link className="breadcrumb-link" to="/">
          ← Home
        </Link>
        <section className="ent-card connection-empty-state" role="alert">
          <p className="font-hud text-[10px] uppercase tracking-wider text-amber-300">Bridge unavailable</p>
          <h1 className="font-sig text-2xl font-bold text-white">Settings could not load</h1>
          <p className="text-sm text-slate-400">
            Start the MemGateQA bridge on port 8788, then retry. Your configuration stays on the backend and is never
            replaced with sample values.
          </p>
          <code className="connection-empty-error">{loadError}</code>
          <div className="flex flex-wrap gap-2">
            <button className="ent-btn ent-btn-primary" onClick={() => load().catch(() => {})} type="button">
              Retry connection
            </button>
            <Link className="ent-btn ent-btn-secondary" to="/developer">
              Open integration guide
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="case-skeleton loading-state-card h-64" aria-live="polite">
          <span className="loading-state-spinner" />
          <span>Connecting to the MemGateQA bridge…</span>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'cognee', label: 'Cognee' },
    { id: 'llm', label: 'LLM' },
    { id: 'mcp', label: 'MCP' },
    { id: 'gate', label: 'Gate' },
    { id: 'webhooks', label: 'Webhooks' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link className="breadcrumb-link" to="/">
        ← Home
      </Link>

      <header className="ent-card p-6">
        <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Setup</p>
        <h1 className="font-sig text-2xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Connect Cognee memory, pick any LLM, wire MCP, and set outbound webhooks for agent publish + ship-clear events.
        </p>
      </header>

      <div className="settings-tabs flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`nav-pill ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ent-card p-6 space-y-4">
        {tab === 'cognee' ? (
          <>
            <h2 className="font-sig text-lg font-bold text-white">Cognee Cloud API</h2>
            <p className="text-sm text-slate-400">
              Your tenant URL + API key from{' '}
              <a className="text-cyan-400" href="https://www.cognee.ai" rel="noopener noreferrer" target="_blank">
                cognee.ai
              </a>
              . Each agent gets its own dataset name on create.
            </p>
            <Field label="Base URL" value={settings.cognee.baseUrl} onChange={(v) => patch('cognee', 'baseUrl', v)} placeholder="https://your-tenant.aws.cognee.ai" />
            <Field
              label="API key"
              value={settings.cognee.apiKey}
              onChange={(v) => patch('cognee', 'apiKey', v)}
              placeholder={settings.cognee.apiKeySet ? '•••••••• (leave to keep)' : 'your_api_key'}
              secret
            />
            <Field label="Session ID" value={settings.cognee.sessionId} onChange={(v) => patch('cognee', 'sessionId', v)} placeholder="memgateqa" />
            <Field label="Default dataset" value={settings.cognee.defaultDataset} onChange={(v) => patch('cognee', 'defaultDataset', v)} placeholder="default_dataset" />
            <button className="ent-btn ent-btn-secondary ent-btn-sm" disabled={testing === 'cognee'} onClick={testCognee} type="button">
              {testing === 'cognee' ? 'Testing…' : 'Test Cognee connection'}
            </button>
          </>
        ) : null}

        {tab === 'llm' ? (
          <>
            <h2 className="font-sig text-lg font-bold text-white">LLM provider</h2>
            <p className="text-sm text-slate-400">Default for all agents — override per agent when creating.</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {LLM_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  className={`ent-template-card text-left ${provider === p.id ? 'ring-2 ring-cyan-400/60' : ''}`}
                  onClick={() => patch('llm', 'provider', p.id)}
                  type="button"
                >
                  <span className="font-medium text-white">{p.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{p.hint}</span>
                </button>
              ))}
            </div>
            {provider === 'openai' ? (
              <Field
                label="OpenAI API key"
                value={settings.llm.openaiApiKey}
                onChange={(v) => patch('llm', 'openaiApiKey', v)}
                placeholder={settings.llm.openaiApiKeySet ? '••••••••' : 'sk-…'}
                secret
              />
            ) : null}
            {provider === 'gemini' ? (
              <Field
                label="Google AI API key"
                value={settings.llm.geminiApiKey}
                onChange={(v) => patch('llm', 'geminiApiKey', v)}
                placeholder={settings.llm.geminiApiKeySet ? '••••••••' : 'AIza…'}
                secret
              />
            ) : null}
            <label className="block space-y-1">
              <span className="text-sm text-slate-400">Model</span>
              <select
                className="ent-input w-full"
                onChange={(e) => patch('llm', 'model', e.target.value)}
                value={settings.llm.model || models[0] || ''}
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <button className="ent-btn ent-btn-secondary ent-btn-sm" disabled={testing === 'llm'} onClick={testLlm} type="button">
              {testing === 'llm' ? 'Testing…' : 'Test LLM'}
            </button>
          </>
        ) : null}

        {tab === 'mcp' ? (
          <>
            <h2 className="font-sig text-lg font-bold text-white">MCP + SDK</h2>
            <p className="text-sm text-slate-400">
              Connect Cursor, Claude Desktop, or Codex. Optional — the web app runs full audits without MCP.
            </p>
            <Field label="Bridge URL" value={settings.mcp.bridgeUrl} onChange={(v) => patch('mcp', 'bridgeUrl', v)} placeholder="http://localhost:8788" />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input checked={settings.mcp.enabled} onChange={(e) => patch('mcp', 'enabled', e.target.checked)} type="checkbox" />
              MCP server enabled
            </label>
            <Link className="ent-btn ent-btn-secondary ent-btn-sm inline-flex" to="/developer">
              Open integrations hub →
            </Link>
            {mcpConfig ? (
              <details>
                <summary className="cursor-pointer text-sm text-slate-500">Copy MCP config (.mcp.json)</summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900/60 p-3 text-xs text-slate-400">{mcpConfig}</pre>
              </details>
            ) : null}
          </>
        ) : null}

        {tab === 'webhooks' ? (
          <>
            <h2 className="font-sig text-lg font-bold text-white">Outbound webhooks</h2>
            <p className="text-sm text-slate-400">
              Notify Slack, Discord, or any HTTPS endpoint when an agent is published or passes the ship gate.
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                checked={settings.webhooks?.enabled ?? false}
                onChange={(e) => patch('webhooks', 'enabled', e.target.checked)}
                type="checkbox"
              />
              Enable webhooks
            </label>
            <Field
              label="Webhook URL"
              onChange={(v) => patch('webhooks', 'url', v)}
              placeholder="https://hooks.slack.com/services/…"
              value={settings.webhooks?.url ?? ''}
            />
            <Field
              label="Secret (optional)"
              onChange={(v) => patch('webhooks', 'secret', v)}
              placeholder={settings.webhooks?.secretSet ? '•••••••• (leave to keep)' : 'shared-secret'}
              secret
              value={settings.webhooks?.secret ?? ''}
            />
            <div className="space-y-2">
              <span className="text-sm text-slate-400">Events</span>
              {WEBHOOK_EVENTS.map((ev) => {
                const events = settings.webhooks?.events ?? WEBHOOK_EVENTS.map((e) => e.id);
                const checked = events.includes(ev.id);
                return (
                  <label key={ev.id} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...events, ev.id]
                          : events.filter((id) => id !== ev.id);
                        patch('webhooks', 'events', next);
                      }}
                      type="checkbox"
                    />
                    {ev.label}
                  </label>
                );
              })}
            </div>
            <button
              className="ent-btn ent-btn-secondary ent-btn-sm"
              disabled={testing === 'webhook'}
              onClick={testWebhook}
              type="button"
            >
              {testing === 'webhook' ? 'Sending…' : 'Send test webhook'}
            </button>
          </>
        ) : null}

        {tab === 'gate' ? (
          <>
            <h2 className="font-sig text-lg font-bold text-white">Memory gate</h2>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input checked={settings.gate.autonomous} onChange={(e) => patch('gate', 'autonomous', e.target.checked)} type="checkbox" />
              Autonomous gate after remember()
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input checked={settings.gate.autoCertify} onChange={(e) => patch('gate', 'autoCertify', e.target.checked)} type="checkbox" />
              Auto-certify when health ≥ 80%
            </label>
            <Field
              label="Max repair cycles"
              value={String(settings.gate.maxRepairCycles)}
              onChange={(v) => patch('gate', 'maxRepairCycles', Math.min(5, Math.max(1, parseInt(v, 10) || 3)))}
              placeholder="3"
            />
          </>
        ) : null}

        <div className="pt-4 border-t border-slate-700/50">
          <GoButton disabled={busy} label={busy ? 'Saving…' : 'Save settings'} loading={busy} onClick={save} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secret,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secret?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-slate-400">{label}</span>
      <input
        className="ent-input w-full"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={secret ? 'password' : 'text'}
        value={value}
      />
    </label>
  );
}
