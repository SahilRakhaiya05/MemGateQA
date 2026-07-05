import { Link, useParams } from 'react-router-dom';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { CaseHealthStrip } from '../components/case/CaseHealthStrip';
import { CasePageShell } from '../components/case/CasePageShell';
import { PreShipReplyGate } from '../components/PreShipReplyGate';
import { ProofScorecard } from '../components/ProofScorecard';
import { useCaseWorkspace } from '../context/CaseWorkspaceContext';

/** Slim overview — belt + guide live in CaseLayout; this tab shows score + reply gate only. */
export function CaseOverviewPage() {
  const { caseData } = useCaseWorkspace();
  const { caseId } = useParams();
  const before = caseData.resultsBefore ?? [];
  const after = caseData.resultsAfter ?? [];
  const shipReady = (caseData.lastScore ?? 0) >= 80;
  const base = `/cases/${caseId}`;

  return (
    <CasePageShell>
      <CaseHealthStrip caseData={caseData} caseId={caseData.id} />

      {before.length > 0 || after.length > 0 ? (
        <ArcadeMotionCard className="ent-card p-4" delay={0.02}>
          <ProofScorecard caseData={caseData} />
        </ArcadeMotionCard>
      ) : (
        <div className="ent-card p-4 text-sm text-slate-400">
          No audit results yet. Use <strong className="text-slate-200">Run audit</strong> on the belt above — it
          indexes evidence, fires recall traps, and scores memory health.
        </div>
      )}

      <PreShipReplyGate caseData={caseData} />

      {shipReady ? (
        <Link className="case-overview-cta case-overview-cta-clear" preventScrollReset to={`${base}/report`}>
          <span className="case-overview-cta-label">Ready</span>
          <span className="case-overview-cta-title">View memory health certificate</span>
          <span className="case-overview-cta-hint">Download proof for deploy gate</span>
          <span className="case-overview-cta-arrow">→</span>
        </Link>
      ) : null}
    </CasePageShell>
  );
}