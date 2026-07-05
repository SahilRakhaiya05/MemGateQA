import { useEffect, useMemo, useState } from 'react';
import { api, type ModelTier } from '../api/memgateqaApi';
import { presetForTier, tierPresetLabel } from '../lib/modelPresets';

interface AgentModelPickerProps {
  provider: string;
  model: string;
  tier: string;
  tiers: ModelTier[];
  onProviderChange: (p: string) => void;
  onModelChange: (m: string) => void;
  onTierChange: (t: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Google AI' },
] as const;

export function AgentModelPicker({
  provider,
  model,
  tier,
  tiers,
  onProviderChange,
  onModelChange,
  onTierChange,
  disabled,
  compact,
}: AgentModelPickerProps) {
  const [available, setAvailable] = useState<string[]>([]);

  useEffect(() => {
    api.listLlmModels(provider).then(setAvailable).catch(() => setAvailable([]));
  }, [provider]);

  const activeTier = tiers.find((t) => t.id === tier) ?? tiers.find((t) => t.id === 'balanced');

  const tierPresets = useMemo(
    () =>
      tiers.map((t) => ({
        tier: t,
        preset: presetForTier(t, provider, available),
        label: tierPresetLabel(t, provider),
      })),
    [tiers, provider, available],
  );

  const selectTier = (tierId: string) => {
    const t = tiers.find((x) => x.id === tierId);
    if (!t) return;
    onTierChange(tierId);
    onModelChange(presetForTier(t, provider, available));
  };

  const selectProvider = (p: string) => {
    onProviderChange(p);
    const t = tiers.find((x) => x.id === tier) ?? tiers[1];
    if (t) onModelChange(presetForTier(t, p, available));
  };

  useEffect(() => {
    if (!activeTier || model) return;
    const preset = presetForTier(activeTier, provider, available);
    if (preset) onModelChange(preset);
  }, [activeTier, available, model, provider, onModelChange]);

  return (
    <div className={`agent-model-picker ${compact ? 'compact' : ''}`}>
      <div className="agent-model-picker-head">
        <p className="font-hud text-[10px] uppercase tracking-wider text-violet-300">Model slate</p>
        {!compact ? (
          <p className="text-xs text-slate-500">Curated presets per tier — no full model catalog</p>
        ) : null}
      </div>

      <div className="agent-model-provider-row">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            className={`agent-model-provider-btn ${provider === p.id ? 'active' : ''}`}
            disabled={disabled}
            onClick={() => selectProvider(p.id)}
            type="button"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="agent-model-tier-grid">
        {tierPresets.map(({ tier: t, preset, label }) => (
          <button
            key={t.id}
            className={`agent-model-tier-card ${tier === t.id ? 'active' : ''}`}
            disabled={disabled}
            onClick={() => selectTier(t.id)}
            type="button"
          >
            <span className="agent-model-tier-name">{t.label}</span>
            <span className="agent-model-tier-hint">{t.hint}</span>
            <code className="agent-model-tier-preset">{preset || label}</code>
          </button>
        ))}
      </div>

      {model ? (
        <p className="agent-model-active-line">
          Active · <span className="text-violet-300">{provider}</span> · <code>{model}</code>
        </p>
      ) : null}
    </div>
  );
}