import { useCogneeBridge } from '../hooks/useCogneeBridge';

export function BridgeStaleBanner() {
  const { health } = useCogneeBridge();
  const caps = health?.capabilities ?? [];
  const version = health?.bridge_version ?? 'unknown';
  const missingGate = caps.length > 0 && !caps.includes('gate');
  const missingAgents = caps.length > 0 && !caps.includes('agents');
  const missingSettings = caps.length > 0 && !caps.includes('settings');
  const stale = health?.ok && (missingGate || missingAgents || missingSettings);

  if (!stale) return null;

  const reason = missingSettings
    ? 'missing settings routes (/api/settings)'
    : missingAgents
      ? 'missing agent platform routes (/api/agents/*)'
      : 'missing gate routes';

  return (
    <div className="bridge-stale-banner" role="alert">
      <p className="font-bold text-amber-200">Bridge needs restart</p>
      <p className="text-sm text-amber-100/80 mt-1">
        The API server on port 8788 is an old build ({reason}). Stop it and run{' '}
        <code className="font-hud">.\start.ps1</code>.
      </p>
      <p className="text-xs text-slate-400 mt-2">
        Bridge version: {version} · expected 3.4.0+
      </p>
    </div>
  );
}