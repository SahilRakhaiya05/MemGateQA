import type { ModelTier } from '../api/memgateqaApi';

/** Pick the curated preset model for a tier (first available from API list). */
export function presetForTier(tier: ModelTier, provider: string, available: string[]): string {
  const candidates = provider === 'openai' ? tier.openaiModels : tier.geminiModels;
  for (const c of candidates) {
    if (available.includes(c)) return c;
  }
  return candidates[0] ?? '';
}

export function tierPresetLabel(tier: ModelTier, provider: string): string {
  const candidates = provider === 'openai' ? tier.openaiModels : tier.geminiModels;
  return candidates[0] ?? '—';
}