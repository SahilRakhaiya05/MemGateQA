import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type CaseRecord } from '../api/memgateqaApi';
import { CompareArena } from './CompareArena';
import { MemoryGraph3D } from './MemoryGraph3D';
import { MemoryTrapGame } from './MemoryTrapGame';
import { MemoryWikiHub } from './MemoryWikiHub';
import { TrapDepositionBoard } from './TrapDepositionBoard';
import { STUDIO } from '../copy/brand';

type ArenaTab = 'graph' | 'deposition' | 'game' | 'compare' | 'desk';

const ARENA_TABS: ArenaTab[] = ['graph', 'deposition', 'game', 'compare', 'desk'];

function readArenaTab(caseId: string): ArenaTab {
  try {
    const saved = sessionStorage.getItem(`arena-tab-${caseId}`);
    if (saved && ARENA_TABS.includes(saved as ArenaTab)) return saved as ArenaTab;
  } catch {
    /* ignore */
  }
  return 'graph';
}

export function MemoryArena3D({ caseId = 'case-wolfpack' }: { caseId?: string }) {
  const [tab, setTab] = useState<ArenaTab>(() => readArenaTab(caseId));
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [pinnedEvidence, setPinnedEvidence] = useState<string | null>(null);

  useEffect(() => {
    setTab(readArenaTab(caseId));
    setPinnedEvidence(null);
    api.getCase(caseId).then(setCaseData).catch(() => setCaseData(null));
  }, [caseId]);

  useEffect(() => {
    try {
      sessionStorage.setItem(`arena-tab-${caseId}`, tab);
    } catch {
      /* ignore */
    }
  }, [caseId, tab]);

  const handleNodeSelect = useCallback((node: { id?: string } | null) => {
    setPinnedEvidence(node?.id ?? null);
  }, []);

  const failedEvidenceIds = useMemo(() => {
    const fails = (caseData?.resultsBefore ?? []).filter((r) => r.status === 'fail');
    const tests = caseData?.tests ?? [];
    const ids = new Set<string>();
    fails.forEach((f) => {
      const test = tests.find((t) => t.id === f.testId);
      test?.evidenceIds?.forEach((id) => ids.add(id));
    });
    return [...ids];
  }, [caseData]);

  const failedTestIds = useMemo(
    () => (caseData?.resultsBefore ?? []).filter((r) => r.status === 'fail').map((r) => r.testId),
    [caseData],
  );

  const tabs: { id: ArenaTab; label: string; hint: string }[] = [
    { id: 'graph', label: STUDIO.graph, hint: '3D memory map · search · pin evidence' },
    { id: 'deposition', label: STUDIO.deposition, hint: 'Witness contradictions on the wall' },
    { id: 'game', label: STUDIO.game, hint: 'Playable recall trap checks' },
    { id: 'compare', label: STUDIO.compare, hint: 'Batch RAG vs graph on failed traps' },
    { id: 'desk', label: STUDIO.desk, hint: 'Ingest · query · verify recall' },
  ];

  return (
    <section className="memory-arena-3d space-y-4">
      <div className="memory-arena-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`memory-arena-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            title={t.hint}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'graph' ? (
        <>
          <MemoryGraph3D
            caseId={caseId}
            caseName={caseData?.agent ?? caseData?.name}
            evidence={caseData?.evidence}
            failedEvidenceIds={failedEvidenceIds}
            highlightFail={failedEvidenceIds.length > 0}
            height={520}
            onNodeSelect={handleNodeSelect}
            tests={caseData?.tests}
          />
          {pinnedEvidence ? (
            <p className="memory-arena-pinned font-hud text-[10px] text-cyan-300">
              Pinned: {pinnedEvidence}
            </p>
          ) : null}
        </>
      ) : null}

      {tab === 'deposition' ? <TrapDepositionBoard caseId={caseId} /> : null}
      {tab === 'game' ? <MemoryTrapGame caseId={caseId} /> : null}
      {tab === 'compare' ? (
        caseData && failedTestIds.length > 0 ? (
          <CompareArena caseData={caseData} failedTestIds={failedTestIds} />
        ) : (
          <p className="text-sm text-slate-400">
            {caseData
              ? 'No failed traps yet — run the belt first, then compare RAG vs graph.'
              : 'Loading compare arena…'}
          </p>
        )
      ) : null}
      {tab === 'desk' ? <MemoryWikiHub caseId={caseId} compact /> : null}

      <div className="memory-arena-pinned flex flex-wrap gap-2">
        <Link className="ent-btn ent-btn-primary ent-btn-sm" to="/agents/create">
          Build agent in chat
        </Link>
        <Link className="ent-btn ent-btn-secondary ent-btn-sm" to={`/cases/${caseId}`}>
          Open belt
        </Link>
      </div>
    </section>
  );
}