interface AgentPipelineStripProps {
  phase?: 'describe' | 'index' | 'qa' | 'chat' | 'publish';
  compact?: boolean;
}

const STEPS = [
  { id: 'describe', icon: '💬', label: 'Describe', detail: 'Chat your real facts' },
  { id: 'index', icon: '📥', label: 'Cognee', detail: 'remember() indexes memory' },
  { id: 'qa', icon: '🔍', label: 'MemGate QA', detail: 'Trap tests on recall()' },
  { id: 'chat', icon: '🤖', label: 'Live agent', detail: 'Recall + LLM every turn' },
  { id: 'publish', icon: '🔗', label: 'Share', detail: 'Public link optional' },
] as const;

export function AgentPipelineStrip({ phase = 'describe', compact }: AgentPipelineStripProps) {
  const activeIdx = STEPS.findIndex((s) => s.id === phase);

  return (
    <div className={`agent-pipeline-strip ${compact ? 'compact' : ''}`}>
      {STEPS.map((step, i) => {
        const done = activeIdx > i;
        const active = step.id === phase;
        return (
          <div
            key={step.id}
            className={`agent-pipeline-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}
          >
            <span className="agent-pipeline-icon">{step.icon}</span>
            <div className="agent-pipeline-copy">
              <span className="agent-pipeline-label">{step.label}</span>
              {!compact ? <span className="agent-pipeline-detail">{step.detail}</span> : null}
            </div>
            {i < STEPS.length - 1 ? <span className="agent-pipeline-connector" aria-hidden /> : null}
          </div>
        );
      })}
    </div>
  );
}