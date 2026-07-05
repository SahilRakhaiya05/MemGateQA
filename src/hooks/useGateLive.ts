import { useCallback, useEffect, useState } from 'react';
import { api, type AutonomousGateResult, type AutonomousGateStatus, type CaseRecord } from '../api/memgateqaApi';

const POLL_RUNNING_MS = 1500;
const POLL_IDLE_MS = 5000;

export interface UseGateLiveResult {
  caseData: CaseRecord | null;
  gateStatus: AutonomousGateStatus | null;
  gateResult: AutonomousGateResult | null;
  loading: boolean;
  error: string;
  running: boolean;
  refresh: () => void;
  runGate: (opts?: {
    forceReindex?: boolean;
    startWatch?: boolean;
    autoCertify?: boolean;
    maxRepairCycles?: number;
  }) => Promise<AutonomousGateResult>;
}

export function useGateLive(caseId: string): UseGateLiveResult {
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [gateStatus, setGateStatus] = useState<AutonomousGateStatus | null>(null);
  const [gateResult, setGateResult] = useState<AutonomousGateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const running = busy || Boolean(gateStatus?.running);

  const refresh = useCallback(() => {
    if (!caseId) return;
    Promise.all([api.getCase(caseId), api.gateStatus(caseId)])
      .then(([c, s]) => {
        setCaseData(c);
        setGateStatus(s);
        setError('');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Bridge unreachable'));
  }, [caseId]);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh();
    setLoading(false);
  }, [caseId, refresh]);

  useEffect(() => {
    if (!caseId) return;
    const ms = running ? POLL_RUNNING_MS : POLL_IDLE_MS;
    const t = setInterval(refresh, ms);
    return () => clearInterval(t);
  }, [caseId, refresh, running]);

  const runGate = useCallback(
    async (opts?: {
      forceReindex?: boolean;
      startWatch?: boolean;
      autoCertify?: boolean;
      maxRepairCycles?: number;
    }) => {
      if (!caseId) throw new Error('No case selected');
      setBusy(true);
      setGateResult(null);
      try {
        const res = await api.runAutonomousGate(caseId, {
          forceReindex: opts?.forceReindex ?? false,
          startWatch: opts?.startWatch ?? true,
          autoCertify: opts?.autoCertify ?? true,
          maxRepairCycles: opts?.maxRepairCycles ?? 3,
        });
        setGateResult(res);
        refresh();
        return res;
      } finally {
        setBusy(false);
      }
    },
    [caseId, refresh],
  );

  return {
    caseData,
    gateStatus,
    gateResult,
    loading,
    error,
    running,
    refresh,
    runGate,
  };
}