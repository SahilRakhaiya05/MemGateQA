import { Link } from 'react-router-dom';

const TEMPLATES = [
  {
    id: 'support',
    name: 'Customer support agent',
    agent: 'Support Memory Agent',
    dataset: 'memgateqa_support_audit',
    description: 'Audit cross-session customer memory: tickets, account notes, forget-on-request.',
  },
  {
    id: 'internal',
    name: 'Internal ops copilot',
    agent: 'Ops Copilot',
    dataset: 'memgateqa_ops_audit',
    description: 'Test stale runbooks, premise traps, and evidence grounding for internal agents.',
  },
  {
    id: 'compliance',
    name: 'Compliance & privacy',
    agent: 'Regulated Data Agent',
    dataset: 'memgateqa_compliance',
    description: 'Privacy leak tests, forget verification, and proof export for legal review.',
  },
  {
    id: 'wolfpack',
    name: 'WolfPack reference case',
    agent: 'WolfPack Project Agent',
    dataset: 'memgateqa_wolfpack',
    description: 'Pre-built memory incident: stale architecture, token leak, forget failure.',
    link: '/cases/case-wolfpack',
  },
];

export type CaseTemplate = (typeof TEMPLATES)[number];

interface CaseTemplatesProps {
  onSelect: (t: Omit<CaseTemplate, 'id' | 'link'>) => void;
}

export function CaseTemplates({ onSelect }: CaseTemplatesProps) {
  return (
    <div className="ent-templates">
      <h3 className="font-sig text-sm font-bold text-white">Enterprise templates</h3>
      <p className="mt-1 text-xs text-slate-500">Start from a common audit pattern — customize after create.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {TEMPLATES.map((t) =>
          t.link ? (
            <Link key={t.id} className="ent-template-card ent-template-link" to={t.link}>
              <span className="font-medium text-white">{t.name}</span>
              <span className="mt-1 block text-xs text-slate-500">{t.description}</span>
            </Link>
          ) : (
            <button
              key={t.id}
              className="ent-template-card text-left"
              onClick={() =>
                onSelect({
                  name: t.name,
                  agent: t.agent,
                  dataset: t.dataset,
                  description: t.description,
                })
              }
              type="button"
            >
              <span className="font-medium text-white">{t.name}</span>
              <span className="mt-1 block text-xs text-slate-500">{t.description}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}