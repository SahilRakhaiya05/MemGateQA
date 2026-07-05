interface AiRepairPlanPanelProps {
  plan?: string;
  onApply?: (plan: string) => void;
}

/** LLM + gap-fill repair plan surfaced for human-approved surgery. */
export function AiRepairPlanPanel({ plan, onApply }: AiRepairPlanPanelProps) {
  if (!plan?.trim()) return null;

  return (
    <section className="ai-repair-plan ent-card p-4 border border-violet-400/25 bg-violet-400/5">
      <p className="font-hud text-[10px] uppercase tracking-wider text-violet-300">AI diagnosis</p>
      <h3 className="font-sig text-lg font-bold text-white">Autonomous repair plan</h3>
      <p className="mt-1 text-sm text-slate-400">
        Generated during gate diagnose — review before approving improve() + forget().
      </p>
      <pre className="ai-repair-plan-body mt-3 whitespace-pre-wrap text-sm text-slate-300">{plan.trim()}</pre>
      {onApply ? (
        <button className="ent-btn ent-btn-secondary ent-btn-sm mt-3" onClick={() => onApply(plan.trim())} type="button">
          Apply to surgery instruction
        </button>
      ) : null}
    </section>
  );
}