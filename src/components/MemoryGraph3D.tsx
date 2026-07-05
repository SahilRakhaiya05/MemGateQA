import type { EvidenceItem } from '../api/memgateqaApi';
import type { GraphNode, GraphTestInput } from '../lib/graphModel';
import { ObsidianGraphView } from './ObsidianGraphView';

interface MemoryGraph3DProps {
  caseId?: string;
  evidence?: EvidenceItem[];
  tests?: GraphTestInput[];
  caseName?: string;
  highlightFail?: boolean;
  failedEvidenceIds?: string[];
  height?: number;
  compact?: boolean;
  onNodeSelect?: (node: GraphNode | null) => void;
}

/** Obsidian-style graph — default 3D orbit, toggle to 2D */
export function MemoryGraph3D({
  caseId = 'case-wolfpack',
  evidence,
  tests,
  caseName,
  highlightFail = false,
  failedEvidenceIds,
  height = 420,
  compact,
  onNodeSelect,
}: MemoryGraph3DProps) {
  return (
    <ObsidianGraphView
      caseId={caseId}
      caseName={caseName}
      compact={compact}
      defaultMode="3d"
      evidence={evidence}
      failedEvidenceIds={failedEvidenceIds}
      height={height}
      highlightFail={highlightFail}
      onNodeSelect={onNodeSelect}
      tests={tests}
    />
  );
}