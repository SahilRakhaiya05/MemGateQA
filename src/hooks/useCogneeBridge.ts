import { useCallback, useEffect, useState } from 'react';
import type { BridgeHealth } from '../api/memgateqaApi';
import { api, BRIDGE_OFFLINE_MSG } from '../api/memgateqaApi';

export function useCogneeBridge() {
  const [health, setHealth] = useState<BridgeHealth | null>(null);
  const [loading, setLoading] = useState(false);

  const poll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.health();
      setHealth(data);
    } catch {
      setHealth({ ok: false, mode: 'offline', cognee_reachable: false, case_count: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 12_000);
    return () => clearInterval(interval);
  }, [poll]);

  return {
    connectedMode: Boolean(health?.cognee_reachable),
    bridgeOnline: health?.ok !== false,
    offlineMessage: health?.ok === false ? BRIDGE_OFFLINE_MSG : null,
    health,
    loading,
    refresh: poll,
  };
}