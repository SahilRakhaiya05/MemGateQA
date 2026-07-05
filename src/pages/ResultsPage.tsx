import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { CasePageShell } from '../components/case/CasePageShell';
import { ScoreArcBanner } from '../components/ScoreArcBanner';
import { HealthScoreGauge } from '../components/HealthScoreGauge';

import { CompareArena } from '../components/CompareArena';
import { ContradictionPanel } from '../components/ContradictionPanel';
import { MemoryLintReport } from '../components/MemoryLintReport';
import { DecoyScorecard } from '../components/DecoyScorecard';
import { PrivacyForgetHero } from '../components/PrivacyForgetHero';
import { ProofScorecard } from '../components/ProofScorecard';
import { RagGraphCompare } from '../components/RagGraphCompare';
import { TrapBeforeAfterSplit } from '../components/TrapBeforeAfterSplit';
import { GateTriptychPanel } from '../components/GateTriptychPanel';
import { SuspectWall } from '../components/SuspectWall';
import { api } from '../api/memgateqaApi';
import { buildLintFindings } from '../lib/memoryLint';
import { useCaseWorkspace } from '../context/CaseWorkspaceContext';

export function ResultsPage() {
  const { caseData } = useCaseWorkspace();
  const before = caseData.resultsBefore ?? [];
  const after = caseData.resultsAfter ?? [];
  const active = after.length ? after : before;
  const label = after.length ? 'After surgery' : before.length ? 'Before surgery' : null;
  const [compareId, setCompareId] = useState<string | null>(null);
  const [compare, setCompare] = useState<Awaited<ReturnType<typeof api.compare>> | null>(null);
  const [comparing, setComparing] = useState(false);

  const runCompare = async (testId: string) => {
    setComparing(true);
    setCompareId(testId);
    try {
      const res = await api.compare(caseData.id, testId);
      setCompare(res);
    } catch {
      setCompare(null);
    } finally {
      setComparing(false);
    }
  };

  if (!active.length) {
    return (
      <CasePageShell>
        <ArcadeMotionCard className="ent-empty py-16" stamp>
          <p className="text-4xl">⚖️</p>
          <p className="mt-3 text-slate-400">No interrogation results yet.</p>
          <Link className="ent-btn ent-btn-primary mt-6 inline-block" to={`/cases/${caseData.id}/tests`}>
            Run trap tests →
          </Link>
        </ArcadeMotionCard>
      </CasePageShell>
    );
  }

  const failedResults = active.filter((r) => r.status === 'fail');
  const failed = failedResults.length;
  const lintFindings = buildLintFindings(caseData, active);
  const failedTestIds = failedResults.map((r) => r.testId);
  const score = caseData.lastScore ?? 0;
  const compareTest = compareId ? caseData.tests.find((t) => t.id === compareId) : null;
  const report = caseData.reports?.[0] as { scoreBefore?: number } | undefined;
  const scoreBefore = after.length
    ? (report?.scoreBefore ??
      (before.length
        ? Math.round(before.reduce((s, r) => s + r.beforeScore, 0) / before.length)
        : undefined))
    : undefined;

  return (
    <CasePageShell>
      <ArcadeMotionCard className="arena-action-panel" stamp>
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <ScoreArcBanner before={scoreBefore} label={label ?? 'Health'} score={score} />
          <div>
            {label ? <p className="mb-2 font-hud text-xs uppercase tracking-wider text-theme-accent">{label}</p> : null}
            <p className="font-hud text-[10px] uppercase tracking-wider text-slate-500">
              {failed} failures pinned
            </p>
            <div className="mt-4 hidden lg:block">
              <HealthScoreGauge breakdown={caseData.lastBreakdown} score={score} size="sm" />
            </div>
          </div>
        </div>
      </ArcadeMotionCard>

      <PrivacyForgetHero caseData={caseData} results={active} />

      {before.length && after.length ? (
        <ArcadeMotionCard className="ent-card p-4" delay={0.02}>
          <TrapBeforeAfterSplit caseData={caseData} />
        </ArcadeMotionCard>
      ) : null}

      <ArcadeMotionCard className="ent-card p-4" delay={0.03}>
        <GateTriptychPanel caseData={caseData} />
      </ArcadeMotionCard>

      <ContradictionPanel findings={lintFindings} />

      <CompareArena caseData={caseData} failedTestIds={failedTestIds} />

      <SuspectWall
        caseData={caseData}
        comparingId={comparing ? compareId : null}
        onCompare={runCompare}
        results={active}
      />

      {comparing ? (
        <div className="compare-loading">
          <span className="compare-loading-spinner" />
          Comparing RAG vs Graph for {compareTest?.title ?? 'trap test'}…
        </div>
      ) : null}

      {compare && compareTest && !comparing ? (
        <RagGraphCompare
          expected={compareTest.expected}
          graph={compare.graph}
          rag={compare.rag}
          testTitle={compareTest.title}
        />
      ) : null}

      <ProofScorecard caseData={caseData} />
      <DecoyScorecard caseData={caseData} />

      <MemoryLintReport caseData={caseData} findings={lintFindings} />
    </CasePageShell>
  );
}