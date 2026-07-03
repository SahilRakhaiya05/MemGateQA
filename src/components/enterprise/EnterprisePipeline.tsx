import { motion } from 'framer-motion';

const STAGES = [
  { id: 'intake', label: 'Evidence Intake', api: 'Upload corpus', gate: 'Structured evidence' },
  { id: 'remember', label: 'Remember', api: 'cognee.remember()', gate: 'Graph built' },
  { id: 'interrogate', label: 'Interrogate', api: 'cognee.recall()', gate: 'Trap tests run' },
  { id: 'surgery', label: 'Repair', api: 'improve + forget', gate: 'Human approved' },
  { id: 'rerun', label: 'Regression', api: 'cognee.recall()', gate: 'Re-validated' },
  { id: 'ship', label: 'Ship Proof', api: 'Export report', gate: 'Health ≥ threshold' },
] as const;

const STATUS_INDEX: Record<string, number> = {
  open: 0,
  intake: 1,
  tested: 2,
  surgery: 3,
  repaired: 4,
  closed: 5,
};

interface EnterprisePipelineProps {
  status: string;
  score?: number | null;
  caseName?: string;
  compact?: boolean;
}

export function EnterprisePipeline({ status, score, caseName, compact = false }: EnterprisePipelineProps) {
  const activeIdx = STATUS_INDEX[status] ?? 0;
  const shipReady = score != null && score >= 80;

  return (
    <div className={`ent-pipeline ${compact ? 'ent-pipeline-compact' : ''}`}>
      <div className="ent-pipeline-head">
        <div>
          <h2 className="ent-pipeline-title">Memory QA Pipeline</h2>
          {!compact && (
            <p className="ent-pipeline-sub">
              CI/CD gate for Cognee agent memory — not a game; a production readiness workflow.
            </p>
          )}
        </div>
        {caseName ? (
          <div className="ent-work-order">
            <span className="font-hud text-[10px] uppercase text-slate-500">Work order</span>
            <span className="font-sig text-sm font-bold text-white">{caseName}</span>
          </div>
        ) : null}
        {score != null ? (
          <div className={`ent-health-pill ${shipReady ? 'ready' : score >= 50 ? 'warn' : 'fail'}`}>
            <span className="font-hud text-[10px] uppercase">Health</span>
            <span className="font-sig text-2xl font-bold">{score}%</span>
            <span className="font-hud text-[9px]">{shipReady ? 'SHIP CLEAR' : 'GATE BLOCKED'}</span>
          </div>
        ) : null}
      </div>

      <div className="ent-pipeline-track">
        {STAGES.map((stage, idx) => {
          const done = idx < activeIdx;
          const active = idx === activeIdx;
          const pending = idx > activeIdx;
          return (
            <div key={stage.id} className="ent-stage-wrap">
              <motion.div
                animate={active ? { boxShadow: '0 0 24px rgba(34,211,238,0.25)' } : {}}
                className={`ent-stage ${done ? 'done' : ''} ${active ? 'active' : ''} ${pending ? 'pending' : ''}`}
              >
                <div className="ent-stage-num">{idx + 1}</div>
                <div className="ent-stage-label">{stage.label}</div>
                <div className="ent-stage-api font-hud">{stage.api}</div>
                <div className="ent-stage-gate">{stage.gate}</div>
              </motion.div>
              {idx < STAGES.length - 1 ? (
                <div className={`ent-connector ${idx < activeIdx ? 'done' : ''}`}>
                  <div className="ent-connector-line" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}