import { useCallback, useEffect, useState } from 'react';
import type { BridgeHealth } from '../api/memgateqaApi';
import { api } from '../api/memgateqaApi';

const mockMode = String(import.meta.env.VITE_MEMGATEQA_MOCK ?? 'true') !== 'false';

export function useCogneeBridge() {
  const [health, setHealth] = useState<BridgeHealth | null>(null);
  const [loading, setLoading] = useState(false);

  const poll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.health();
      setHealth(data);
    } catch {
      setHealth(mockMode ? { ok: true, mode: 'mock', cognee_reachable: false, case_count: 0 } : null);
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
    connectedMode: !mockMode,
    health,
    loading,
    refresh: poll,
  };
}