import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type CaseRecord } from '../api/memgateqaApi';
import { buildLintFindings, lintSummary } from '../lib/memoryLint';
import { MemoryLintReport } from './MemoryLintReport';
import { WikiQueryPanel } from './WikiQueryPanel';
import { WIKI } from '../copy/brand';

type WikiTab = 'ingest' | 'query' | 'lint';

interface MemoryWikiHubProps {
  caseId?: string;
  compact?: boolean;
}

export function MemoryWikiHub({ caseId = 'case-wolfpack', compact }: MemoryWikiHubProps) {
  const [tab, setTab] = useState<WikiTab>('lint');
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [audit, setAudit] = useState<{ nodeCount: number; edgeCount: number } | null>(null);

  useEffect(() => {
    api.getCase(caseId).then(setCaseData).catch(() => setCaseData(null));
    api.wikiAudit(caseId).then(setAudit).catch(() => setAudit(null));
  }, [caseId]);

  const findings = useMemo(() => {
    if (!caseData) return [];
    const results = caseData.resultsAfter?.length ? caseData.resultsAfter : caseData.resultsBefore ?? [];
    return buildLintFindings(caseData, results);
  }, [caseData]);
  const summary = lintSummary(findings);

  const tabs: { id: WikiTab; label: string; sub: string }[] = [
    { id: 'ingest', label: WIKI.ingest, sub: 'remember' },
    { id: 'query', label: WIKI.query, sub: 'recall' },
    { id: 'lint', label: WIKI.lint, sub: 'ship check' },
  ];

  return (
    <section className={`memory-wiki-hub ${compact ? 'compact' : ''}`}>
      <header className="memory-wiki-hub-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-widest text-cyan-300">{WIKI.kicker}</p>
          <h2 className="font-sig text-xl font-bold text-white">{WIKI.title}</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">{WIKI.sub}</p>
        </div>
        {audit ? (
          <div className="memory-wiki-audit-pills">
            <span>{audit.nodeCount} nodes</span>
            <span>{audit.edgeCount} links</span>
            <span>{caseData?.tests?.length ?? 0} checks</span>
            <span className={summary.shipBlocked ? 'warn' : 'ok'}>
              {summary.shipBlocked ? WIKI.shipBlocked : WIKI.lintClear}
            </span>
          </div>
        ) : null}
      </header>

      <div className="memory-wiki-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`memory-wiki-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            <span className="memory-wiki-tab-label">{t.label}</span>
            <span className="memory-wiki-tab-sub">{t.sub}</span>
          </button>
        ))}
      </div>

      <div className="memory-wiki-body ent-card p-5">
        {tab === 'ingest' ? (
          <div className="memory-wiki-ingest space-y-4">
            <p className="text-sm text-slate-400">
              Drop files, paste URLs, or chat facts into your agent. We index everything into Cognee memory.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link className="ent-btn ent-btn-primary" to={`/cases/${caseId}/evidence`}>
                Add evidence
              </Link>
              <Link className="ent-btn ent-btn-secondary" to="/agents/create">
                Build agent in chat
              </Link>
              <Link className="ent-btn ent-btn-ghost" to={`/cases/${caseId}`}>
                Run belt
              </Link>
            </div>
          </div>
        ) : null}

        {tab === 'query' ? <WikiQueryPanel caseId={caseId} /> : null}

        {tab === 'lint' && caseData ? (
          <div className="space-y-4">
            <MemoryLintReport caseData={caseData} findings={findings} />
            <div className="flex flex-wrap gap-2">
              <Link className="ent-btn ent-btn-primary ent-btn-sm" to={`/cases/${caseId}/results`}>
                Compare recall modes
              </Link>
              <Link className="ent-btn ent-btn-secondary ent-btn-sm" to={`/cases/${caseId}/surgery`}>
                Fix memory
              </Link>
              <Link className="ent-btn ent-btn-ghost ent-btn-sm" to="/settings">
                Webhooks
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}