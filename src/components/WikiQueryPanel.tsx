import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/memgateqaApi';
import { useToast } from './Toast';

interface WikiQueryPanelProps {
  caseId: string;
}

/** Plaid-style query + recall — production probe, not a game. */
export function WikiQueryPanel({ caseId }: WikiQueryPanelProps) {
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('');
  const [recallPreview, setRecallPreview] = useState('');
  const [busy, setBusy] = useState(false);

  const runQuery = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setReply('');
    try {
      const res = await api.agentChat(caseId, q);
      setReply(res.answer);
      setRecallPreview(res.recallPreview ?? '');
      toast('Recall complete', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Query failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const runLintAfter = async () => {
    setBusy(true);
    try {
      await api.interrogate(caseId);
      toast('Trap suite ran — check Lint tab for findings', 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Interrogate failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wiki-query-panel">
      <label className="wiki-query-label">
        <span>Ask your agent memory</span>
        <textarea
          className="ent-input wiki-query-input"
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What is the final backend stack? What time is the demo?"
          rows={2}
          value={question}
        />
      </label>
      <div className="wiki-query-actions">
        <button className="ent-btn ent-btn-primary ent-btn-sm" disabled={busy || !question.trim()} onClick={runQuery} type="button">
          {busy ? 'Recalling…' : 'Query recall()'}
        </button>
        <button className="ent-btn ent-btn-secondary ent-btn-sm" disabled={busy} onClick={runLintAfter} type="button">
          Run memory check
        </button>
        <Link className="ent-btn ent-btn-ghost ent-btn-sm" to={`/cases/${caseId}/surgery`}>
          improve() →
        </Link>
      </div>
      {reply ? (
        <div className="wiki-query-result">
          <p className="wiki-query-result-label">Agent answer</p>
          <p className="wiki-query-result-text">{reply}</p>
          {recallPreview ? (
            <p className="wiki-query-recall-preview">
              <span className="label">Recall context</span> {recallPreview.slice(0, 280)}
              {recallPreview.length > 280 ? '…' : ''}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}