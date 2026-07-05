import { useState } from 'react';
import { api, type CaseRecord } from '../api/memgateqaApi';
import { GoButton } from './arcade/GoButton';
import { useToast } from './Toast';

interface ReplyGateResult {
  verdict: 'SHIP' | 'BLOCK';
  shipReady: boolean;
  recallAnswer: string;
  failures: { testId: string; title?: string; category?: string; reason: string }[];
  trapResults: { testId: string; title?: string; status: string; reason: string }[];
  checked: number;
}

interface PreShipReplyGateProps {
  caseData: CaseRecord;
}

/** Step 7 — simulate user message → recall() → trap check before agent replies. */
export function PreShipReplyGate({ caseData }: PreShipReplyGateProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('What stack are we using and when is the demo?');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReplyGateResult | null>(null);

  const check = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await api.replyGate(caseData.id, message);
      setResult(res);
      toast(
        res.verdict === 'SHIP' ? 'Reply clear — safe to send' : `Blocked — ${res.failures.length} trap(s) failed`,
        res.verdict === 'SHIP' ? 'success' : 'error',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Reply gate failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ent-card p-4 reply-gate">
      <p className="font-hud text-[10px] uppercase tracking-wider text-amber-300">Step before send</p>
      <h3 className="font-sig text-lg font-bold text-white">Reply gate</h3>
      <p className="mt-1 text-sm text-slate-400">
        Type what a user would ask your agent. Cognee <code className="text-cyan-300">recall()</code> runs, then trap
        tests decide if the agent can safely reply.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="ent-input flex-1 min-w-[200px]"
          onChange={(e) => setMessage(e.target.value)}
          placeholder="User message to check…"
          value={message}
        />
        <GoButton disabled={busy || !message.trim()} label={busy ? '…' : 'Check reply'} loading={busy} onClick={check} />
      </div>

      {result ? (
        <div className={`reply-gate-verdict mt-4 ${result.verdict === 'SHIP' ? 'ship' : 'block'}`}>
          <span className="reply-gate-badge">{result.verdict === 'SHIP' ? '✓ Safe to reply' : '✕ Block reply'}</span>
          <p className="mt-2 text-xs text-slate-400">{result.checked} checks · Cognee recall + {result.trapResults.length} traps</p>
          {result.failures.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {result.failures.map((f) => (
                <li key={f.testId} className="text-sm text-red-300">
                  {f.title ?? f.testId}: {f.reason}
                </li>
              ))}
            </ul>
          ) : null}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-slate-500">Recall preview</summary>
            <pre className="mt-1 max-h-32 overflow-auto text-xs text-slate-400 whitespace-pre-wrap">{result.recallAnswer}</pre>
          </details>
        </div>
      ) : null}
    </section>
  );
}