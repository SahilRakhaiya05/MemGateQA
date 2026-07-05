import type { EvidenceItem } from '../api/memgateqaApi';
import type { GraphTestInput } from '../lib/graphModel';
import { ObsidianGraphView } from './ObsidianGraphView';

interface MemoryGraphPanelProps {
  caseId: string;
  highlightFail?: boolean;
  evidence?: EvidenceItem[];
  tests?: GraphTestInput[];
  caseName?: string;
  failedEvidenceIds?: string[];
  height?: number;
}

/** Obsidian-style 2D force graph — all nodes, labels, search, pan/zoom */
export function MemoryGraphPanel({
  caseId,
  highlightFail = false,
  evidence,
  tests,
  caseName,
  failedEvidenceIds,
  height = 420,
}: MemoryGraphPanelProps) {
  return (
    <ObsidianGraphView
      caseId={caseId}
      caseName={caseName}
      defaultMode="2d"
      evidence={evidence}
      failedEvidenceIds={failedEvidenceIds}
      height={height}
      highlightFail={highlightFail}
      tests={tests}
    />
  );
}