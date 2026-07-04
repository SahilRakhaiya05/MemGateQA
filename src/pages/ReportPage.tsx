import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { playThwack } from '../audio/sfx';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { GoButton } from '../components/arcade/GoButton';
import { PipelineFocusCard } from '../components/arcade/PipelineFocusCard';
import { api, type HealthBreakdown } from '../api/memgateqaApi';
import { MemoryCertificate } from '../components/MemoryCertificate';
import { celebrateShip } from '../lib/celebrate';
import type { CaseOutletContext } from './CaseLayout';

export function ReportPage() {
  const { caseData, reload } = useOutletContext<CaseOutletContext>();
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
  const shipReady = (scoreAfter ?? 0) >= 80;

  return (
    <div className="space-y-6">
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
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <GoButton disabled={busy} label={busy ? '…' : 'SHIP'} loading={busy} onClick={generate} />
          <span className="font-hud text-[10px] uppercase text-slate-500">Generate deploy proof</span>
        </div>
      </ArcadeMotionCard>

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
          />
          <div className="flex flex-wrap gap-3">
            <button className="ent-btn ent-btn-secondary" onClick={download} type="button">
              Download JSON certificate
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
    </div>
  );
}