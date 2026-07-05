import { useState } from 'react';
import { playThwack } from '../audio/sfx';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { GoButton } from '../components/arcade/GoButton';
import { PipelineFocusCard } from '../components/arcade/PipelineFocusCard';
import { CasePageShell } from '../components/case/CasePageShell';
import { api, type HealthBreakdown } from '../api/memgateqaApi';
import { MemoryCertificate } from '../components/MemoryCertificate';
import { MemoryLintReport } from '../components/MemoryLintReport';
import { DecoyScorecard } from '../components/DecoyScorecard';
import { PrivacyForgetHero } from '../components/PrivacyForgetHero';
import { ProofScorecard } from '../components/ProofScorecard';
import { ProvenancePanel } from '../components/ProvenancePanel';
import { TrapBeforeAfterSplit } from '../components/TrapBeforeAfterSplit';
import { GateTriptychPanel } from '../components/GateTriptychPanel';

import { buildLintFindings } from '../lib/memoryLint';
import { celebrateShip } from '../lib/celebrate';
import { useCaseWorkspace } from '../context/CaseWorkspaceContext';

export function ReportPage() {
  const { caseData, reload } = useCaseWorkspace();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [stamped, setStamped] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const data = await api.report(caseData.id);
      setReport(data as Record<string, unknown>);
      reload();
      const scoreAfter = data.scoreAfter as number | undefined;
      if (scoreAfter != null && scoreAfter >= 80) {
        playThwack();
        celebrateShip();
      }
      setStamped(true);
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memgateqa-${caseData.id}-certificate.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scoreBefore = report?.scoreBefore as number | null | undefined;
  const scoreAfter = report?.scoreAfter as number | null | undefined;
  const breakdownAfter = report?.breakdownAfter as HealthBreakdown | undefined;
  const shipReady = (scoreAfter ?? caseData.lastScore ?? 0) >= 80;
  const lintFindings = buildLintFindings(
    caseData,
    caseData.resultsAfter?.length ? caseData.resultsAfter : caseData.resultsBefore ?? [],
  );

  return (
    <CasePageShell
      actions={
        <div className="flex flex-wrap items-center gap-4">
          <GoButton disabled={busy} label={busy ? '…' : 'SHIP'} loading={busy} onClick={generate} />
          <span className="font-hud text-[10px] uppercase text-slate-500">Generate deploy proof</span>
        </div>
      }
    >
      <ArcadeMotionCard className="arena-action-panel" stamp>
        <PipelineFocusCard
          activeStep={4}
          body="Generate a Memory Health Certificate for compliance, deploy gates, and stakeholder sign-off. Score must clear the 80% gate."
          fields={[
            { label: 'Case', value: caseData.name },
            { label: 'Agent', value: caseData.agent },
            { label: 'Current health', value: caseData.lastScore != null ? `${caseData.lastScore}%` : 'Pending' },
          ]}
          title="Memory Health Certificate"
          verdict={stamped ? (shipReady ? 'ACCEPT' : 'HOLD') : null}
        />
      </ArcadeMotionCard>

      <PrivacyForgetHero caseData={caseData} />

      {(caseData.resultsBefore?.length ?? 0) > 0 && (caseData.resultsAfter?.length ?? 0) > 0 ? (
        <ArcadeMotionCard className="ent-card p-4" delay={0.02}>
          <TrapBeforeAfterSplit caseData={caseData} />
        </ArcadeMotionCard>
      ) : null}

      {(caseData.resultsBefore?.length ?? 0) > 0 ? (
        <ArcadeMotionCard className="ent-card p-4" delay={0.03}>
          <GateTriptychPanel caseData={caseData} />
        </ArcadeMotionCard>
      ) : null}

      <ProofScorecard caseData={caseData} />
      <DecoyScorecard caseData={caseData} />
      <MemoryLintReport caseData={caseData} findings={lintFindings} />

      <ProvenancePanel caseId={caseData.id} />

      {report?.forgetProof ? (
        <section className="ent-card p-4">
          <p className="font-hud text-[10px] uppercase tracking-wider text-amber-300">Forget verification</p>
          <h3 className="font-sig text-lg font-bold text-white">Before → after forget()</h3>
          <p className="mt-2 text-sm text-slate-300">
            Data items: {(report.forgetProof as { dataItemsBefore?: number }).dataItemsBefore ?? '?'} →{' '}
            {(report.forgetProof as { dataItemsAfter?: number }).dataItemsAfter ?? '?'}
            {(report.forgetProof as { forgetVerified?: boolean }).forgetVerified
              ? ' · attempted recall of forgotten data: refused / not found'
              : ''}
          </p>
        </section>
      ) : null}

      <section className="ent-card p-4">
        <p className="font-hud text-[10px] uppercase tracking-wider text-emerald-300">Committed proof</p>
        <h3 className="font-sig text-lg font-bold text-white">EVIDENCE.md</h3>
        <p className="mt-2 text-sm text-slate-400">
          Quantified trap results reproducible via{' '}
          <code className="text-cyan-300">npm run audit</code> — see{' '}
          <a
            className="text-cyan-300 underline"
            href="https://github.com/memgateqa/memproof-factory/blob/main/EVIDENCE.md"
            rel="noreferrer"
            target="_blank"
          >
            docs/EVIDENCE.md
          </a>{' '}
          and <code className="text-cyan-300">results/scorecard.json</code> — open without running the app.
        </p>
      </section>

      {report && scoreAfter != null ? (
        <>
          <MemoryCertificate
            agent={caseData.agent}
            breakdown={breakdownAfter}
            caseId={caseData.id}
            caseName={caseData.name}
            dataset={caseData.dataset}
            generatedAt={report.generatedAt as string | undefined}
            scoreAfter={scoreAfter}
            scoreBefore={scoreBefore}
            shipReady={shipReady}
            traceIds={report.traceIds as string[] | undefined}
          />
          <div className="flex flex-wrap gap-3">
            <button className="ent-btn ent-btn-secondary" onClick={download} type="button">
              Download JSON certificate
            </button>
            <button
              className="ent-btn ent-btn-primary"
              onClick={() => api.downloadProofBundle(caseData.id)}
              type="button"
            >
              Download proof bundle (.zip)
            </button>
            {shipReady ? (
              <span className="case-stamp animate-thwack inline-block">SHIP CLEAR</span>
            ) : (
              <span className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 font-hud text-xs uppercase text-amber-300">
                Gate blocked — repair required
              </span>
            )}
          </div>
        </>
      ) : null}
    </CasePageShell>
  );
}