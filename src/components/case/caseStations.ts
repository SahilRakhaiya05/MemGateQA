export type CaseStationId = 'overview' | 'evidence' | 'tests' | 'results' | 'agent' | 'surgery' | 'report';

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
    title: 'Audit dossier',
    subtitle: 'Pipeline status, health score, and memory graph at a glance.',
    pipelineStep: 0,
    path: '',
  },
  {
    id: 'evidence',
    icon: '📥',
    label: 'Evidence',
    title: 'Evidence intake',
    subtitle: 'Load manila packets onto the belt, then INDEX into Cognee with remember().',
    pipelineStep: 1,
    cogneeOp: 'remember',
    path: 'evidence',
  },
  {
    id: 'tests',
    icon: '🔍',
    label: 'Tests',
    title: 'Interrogation room',
    subtitle: 'Trap tests fire recall() — failures pin to the suspect wall.',
    pipelineStep: 2,
    cogneeOp: 'recall',
    path: 'tests',
  },
  {
    id: 'results',
    icon: '⚖️',
    label: 'Results',
    title: 'Suspect wall',
    subtitle: 'Compare RAG vs graph retrieval and inspect failure reasons.',
    pipelineStep: 2,
    cogneeOp: 'recall',
    path: 'results',
  },
  {
    id: 'agent',
    icon: '🤖',
    label: 'Agent',
    title: 'QA agent console',
    subtitle: 'Loop-engineering ticks, Cognee recall chat, and LLM gap-fill plans.',
    pipelineStep: 3,
    cogneeOp: 'recall',
    path: 'agent',
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
];

export function stationById(id: CaseStationId) {
  return CASE_STATIONS.find((s) => s.id === id)!;
}