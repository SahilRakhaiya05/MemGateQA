import type { CaseRecord } from '../api/memgateqaApi';
import { lintSummary, type LintFinding } from '../lib/memoryLint';

interface MemoryLintReportProps {
  caseData: CaseRecord;
  findings: LintFinding[];
}

export function MemoryLintReport({ caseData, findings }: MemoryLintReportProps) {
  const summary = lintSummary(findings);

  const downloadLint = () => {
    const payload = {
      caseId: caseData.id,
      caseName: caseData.name,
      generatedAt: new Date().toISOString(),
      healthScore: caseData.lastScore,
      summary,
      findings,
      trapCategories: [...new Set(caseData.tests.map((t) => t.category))],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memgateqa-${caseData.id}-memory-lint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!findings.length) {
    return (
      <div className="memory-lint-report memory-lint-clear">
        <p className="font-sig text-lg text-emerald-300">✓ Memory lint clear</p>
        <p className="mt-1 text-sm text-slate-400">No open contradictions or gate violations detected.</p>
      </div>
    );
  }

  return (
    <section className="memory-lint-report">
      <div className="memory-lint-head">
        <div>
          <p className="font-hud text-[9px] uppercase tracking-widest text-slate-500">Cognost-style audit</p>
          <h3 className="font-sig text-lg font-bold text-white">Memory lint report</h3>
          <p className="mt-1 text-sm text-slate-400">
            {summary.total} findings · {summary.hard} hard · {summary.temporal} temporal · {summary.soft} soft
          </p>
        </div>
        <button className="ent-btn ent-btn-secondary ent-btn-sm" onClick={downloadLint} type="button">
          Export lint JSON
        </button>
      </div>
      <table className="memory-lint-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Category</th>
            <th>Finding</th>
            <th>Repair</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr key={f.id}>
              <td><span className={`lint-pill lint-pill-${f.severity}`}>{f.severity}</span></td>
              <td className="font-hud text-[10px] uppercase text-slate-500">{f.category}</td>
              <td>
                <span className="font-medium text-white">{f.title}</span>
                <span className="block text-xs text-slate-500 mt-0.5">{f.detail.slice(0, 100)}</span>
              </td>
              <td className="text-xs text-cyan-300/90">{f.repairHint.slice(0, 80)}…</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

