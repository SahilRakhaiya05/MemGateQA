import { motion } from 'framer-motion';
import type { HealthBreakdown } from '../api/memgateqaApi';
import { ComplianceGates } from './enterprise/ComplianceGates';
import { HealthScoreGauge } from './HealthScoreGauge';

interface MemoryCertificateProps {
  caseName: string;
  caseId: string;
  agent: string;
  dataset: string;
  scoreBefore?: number | null;
  scoreAfter: number;
  breakdown?: HealthBreakdown;
  generatedAt?: string;
  shipReady?: boolean;
  traceIds?: string[];
}

export function MemoryCertificate({
  caseName,
  caseId,
  agent,
  dataset,
  scoreBefore,
  scoreAfter,
  breakdown,
  generatedAt,
  shipReady,
  traceIds,
}: MemoryCertificateProps) {
  const ready = shipReady ?? scoreAfter >= 80;
  const date = generatedAt ?? new Date().toISOString();

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="memory-cert"
      initial={{ opacity: 0, scale: 0.98 }}
    >
      <div className="memory-cert-border">
        <div className="memory-cert-inner">
          <header className="memory-cert-header">
            <div>
              <p className="font-hud text-[10px] uppercase tracking-[0.25em] text-cyan-400">MemGateQA</p>
              <h2 className="font-sig text-2xl font-bold text-white">Memory Health Certificate</h2>
            </div>
            {ready ? (
              <motion.div animate={{ rotate: [-8, -6, -8] }} className="case-stamp" transition={{ duration: 2, repeat: Infinity }}>
                Ship cleared
              </motion.div>
            ) : (
              <div className="case-stamp" style={{ borderColor: '#fbbf24', color: '#fbbf24' }}>
                Gate blocked
              </div>
            )}
          </header>

          <div className="memory-cert-meta">
            <CertField label="Audit" value={caseName} />
            <CertField label="Case ID" value={caseId} />
            <CertField label="Agent" value={agent} />
            <CertField label="Dataset" value={dataset} />
            <CertField label="Issued" value={new Date(date).toLocaleString()} />
          </div>

          <div className="memory-cert-score">
            <HealthScoreGauge before={scoreBefore ?? undefined} breakdown={breakdown} score={scoreAfter} size="lg" />
          </div>

          {breakdown ? (
            <div className="memory-cert-gates">
              <ComplianceGates breakdown={breakdown} />
            </div>
          ) : null}

          {traceIds?.length ? (
            <div className="memory-cert-traces">
              <p className="font-hud text-[10px] uppercase text-violet-300">OTEL trace IDs (verify offline)</p>
              <p className="font-mono text-[10px] text-slate-400 break-all">{traceIds.join(' · ')}</p>
            </div>
          ) : null}

          <footer className="memory-cert-footer">
            <p>
              Cognee Cloud lifecycle verified: remember · recall · improve(FEEDBACK) · memify · forget
            </p>
            <p className="font-hud text-[10px] text-slate-500">
              Ship agent memory only after it passes the gate.
            </p>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}

function CertField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-hud text-[9px] uppercase text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-200">{value}</div>
    </div>
  );
}