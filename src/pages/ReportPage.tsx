import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type HealthBreakdown } from '../api/memgateqaApi';
import { ComplianceGates } from '../components/enterprise/ComplianceGates';
import { HealthScoreGauge } from '../components/HealthScoreGauge';
import type { CaseOutletContext } from './CaseLayout';

export function ReportPage() {
  const { caseData, reload } = useOutletContext<CaseOutletContext>();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const data = await api.report(caseData.id);
      setReport(data as Record<string, unknown>);
      reload();
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

  return (
    <div className="ent-card p-6">
      <h2 className="font-sig text-lg font-bold text-white">Memory Health Certificate</h2>
      <p className="mt-1 text-sm text-slate-400">
        Exportable proof for compliance, deploy gates, and stakeholder sign-off.
      </p>

      <button className="ent-btn ent-btn-primary mt-4" disabled={busy} onClick={generate} type="button">
        {busy ? 'Generating…' : 'Generate certificate'}
      </button>

      {report ? (
        <div className="mt-6 space-y-6">
          {scoreAfter != null ? (
            <HealthScoreGauge before={scoreBefore ?? undefined} score={scoreAfter} size="lg" />
          ) : null}
          {breakdownAfter ? <ComplianceGates breakdown={breakdownAfter} /> : null}
          <button className="ent-btn ent-btn-secondary" onClick={download} type="button">
            Download JSON certificate
          </button>
          <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 font-hud text-[11px] text-slate-400">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}