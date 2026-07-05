export type CaseStationId =
  | 'overview'
  | 'graph'
  | 'chat'
  | 'desk'
  | 'evidence'
  | 'tests'
  | 'results'
  | 'surgery'
  | 'report'
  | 'agent';

export interface CaseStationDef {
  id: CaseStationId;
  icon: string;
  label: string;
  title: string;
  subtitle: string;
  pipelineStep: number;
  cogneeOp?: string;
  path: string;
}

export const CASE_STATIONS: CaseStationDef[] = [
  {
    id: 'overview',
    icon: '📋',
    label: 'Overview',
    title: 'Case summary',
    subtitle: 'Health score and audit results. Belt and next step are above.',
    pipelineStep: 0,
    path: '',
  },
  {
    id: 'graph',
    icon: '🕸️',
    label: 'Graph',
    title: 'Memory graph',
    subtitle: 'Search and explore the Cognee memory graph — 2D, 3D, or witness view.',
    pipelineStep: 0,
    cogneeOp: 'graph',
    path: 'graph',
  },
  {
    id: 'chat',
    icon: '💬',
    label: 'Chat',
    title: 'Agent chat',
    subtitle: 'Ask questions — Gemini answers using live Cognee recall.',
    pipelineStep: 0,
    path: 'chat',
  },
  {
    id: 'desk',
    icon: '📚',
    label: 'Desk',
    title: 'Memory desk',
    subtitle: 'Add memory, query recall, and verify ship readiness.',
    pipelineStep: 1,
    path: 'desk',
  },
  {
    id: 'evidence',
    icon: '📥',
    label: 'Evidence',
    title: 'Evidence intake',
    subtitle: 'Load evidence packets, then index into Cognee with remember().',
    pipelineStep: 1,
    cogneeOp: 'remember',
    path: 'evidence',
  },
  {
    id: 'tests',
    icon: '🔍',
    label: 'Tests',
    title: 'Trap tests',
    subtitle: 'Trap questions fire recall() — failures surface memory bugs.',
    pipelineStep: 2,
    cogneeOp: 'recall',
    path: 'tests',
  },
  {
    id: 'results',
    icon: '⚖️',
    label: 'Results',
    title: 'Failure board',
    subtitle: 'Inspect trap failures, RAG vs graph, and privacy traps.',
    pipelineStep: 2,
    cogneeOp: 'recall',
    path: 'results',
  },
  {
    id: 'surgery',
    icon: '🔧',
    label: 'Repair',
    title: 'Memory surgery',
    subtitle: 'Approve improve() + forget() repairs, then rerun the trap suite.',
    pipelineStep: 3,
    cogneeOp: 'improve',
    path: 'surgery',
  },
  {
    id: 'report',
    icon: '📜',
    label: 'Proof',
    title: 'Ship proof',
    subtitle: 'Generate the Memory Health Certificate when score clears the 80% gate.',
    pipelineStep: 4,
    cogneeOp: 'forget',
    path: 'report',
  },
  {
    id: 'agent',
    icon: '⚙️',
    label: 'Auto',
    title: 'Automation',
    subtitle: 'Schedulers, loops, and advanced agent tooling.',
    pipelineStep: 5,
    cogneeOp: 'loop',
    path: 'agent',
  },
];

export function stationById(id: CaseStationId) {
  return CASE_STATIONS.find((s) => s.id === id)!;
}