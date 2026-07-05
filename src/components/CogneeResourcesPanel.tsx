const RESOURCES = [
  { label: 'Self-Improvement Quickstart', href: 'https://docs.cognee.ai/getting-started/self-improvement', hint: 'remember() + recall() in minutes' },
  { label: 'Cognee Documentation', href: 'https://docs.cognee.ai', hint: 'Full memory lifecycle APIs' },
  { label: 'Cognee GitHub', href: 'https://github.com/topoteretes/cognee', hint: 'Open-source repo' },
  { label: 'Cognee Website', href: 'https://www.cognee.ai', hint: 'Memory layer for AI' },
  { label: 'Karpathy Wiki example', href: 'https://docs.cognee.ai/examples/karpathy-wiki', hint: 'Content → knowledge graph' },
  { label: 'Company Brain guide', href: 'https://docs.cognee.ai/guides/company-brain', hint: 'Org-wide memory with Cognee' },
  { label: 'WeMakeDevs resources', href: 'https://www.wemakedevs.org/hackathons/cognee/resources', hint: 'Hackathon guides & links' },
  { label: 'Setup & configuration', href: 'https://docs.cognee.ai/setup-configuration/overview', hint: 'LLM, vector, graph stores' },
] as const;

const INTEGRATIONS = [
  { label: 'Claude Code', href: 'https://docs.cognee.ai/integrations/claude-code' },
  { label: 'Codex', href: 'https://docs.cognee.ai/integrations/codex' },
  { label: 'n8n', href: 'https://docs.cognee.ai/integrations/n8n' },
  { label: 'All integrations', href: 'https://docs.cognee.ai/integrations' },
] as const;

const AGENT_IDEA = {
  title: 'Pre-ship Memory QA Agent',
  pitch:
    'An agent that uses Cognee remember() for every customer interaction, then MemGateQA recall() traps before any reply ships. ' +
    'Auto improve() on stale product facts, forget() on GDPR deletes, and block deploy when health < 80%. ' +
    'Best fit: support bots, sales copilots, and internal tools where wrong memory = wrong answers.',
};

export function CogneeResourcesPanel({ compact }: { compact?: boolean }) {
  return (
    <section className={`cognee-resources ${compact ? 'compact' : ''}`}>
      <div className="ent-card p-5">
        <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Learn Cognee</p>
        <h3 className="font-sig text-lg font-bold text-white">Resources & integrations</h3>
        <div className="cognee-resources-grid mt-4 grid gap-2 sm:grid-cols-2">
          {RESOURCES.map((r) => (
            <a key={r.href} className="cognee-resource-link" href={r.href} rel="noopener noreferrer" target="_blank">
              <span className="font-medium text-white">{r.label}</span>
              <span className="block text-xs text-slate-500">{r.hint}</span>
            </a>
          ))}
        </div>
        {!compact ? (
          <>
            <p className="mt-4 font-hud text-[9px] uppercase tracking-wider text-slate-500">Ecosystem</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {INTEGRATIONS.map((i) => (
                <a key={i.href} className="ent-btn ent-btn-ghost ent-btn-sm" href={i.href} rel="noopener noreferrer" target="_blank">
                  {i.label}
                </a>
              ))}
            </div>
            <div className="agent-idea-card mt-5 p-4 rounded-xl border border-violet-400/25 bg-violet-400/5">
              <p className="font-hud text-[9px] uppercase tracking-wider text-violet-300">Agent idea</p>
              <p className="font-sig font-bold text-white mt-1">{AGENT_IDEA.title}</p>
              <p className="text-sm text-slate-300 mt-2">{AGENT_IDEA.pitch}</p>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}