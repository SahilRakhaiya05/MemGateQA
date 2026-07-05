import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type CaseRecord, type PublicAgentView } from '../api/memgateqaApi';
import { AgentWorkspace } from '../components/AgentWorkspace';

export function PublicSharePage() {
  const { slug } = useParams<{ slug: string }>();
  const [agent, setAgent] = useState<PublicAgentView | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    api.getPublicAgent(slug).then(setAgent).catch((e) => setError(e.message));
  }, [slug]);

  const caseStub: CaseRecord | null = agent
    ? ({
        id: agent.id,
        name: agent.name,
        agent: agent.agent,
        dataset: agent.dataset,
        description: agent.description,
        status: agent.status,
        evidence: [],
        tests: [],
        resultsBefore: [],
        resultsAfter: [],
        reports: [],
        lastScore: agent.lastScore,
        templateId: agent.templateId,
        modelTier: agent.modelTier,
        llmProvider: agent.llmProvider,
      } as CaseRecord)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link className="breadcrumb-link" to="/">
        ← MemGateQA
      </Link>

      {error ? <p className="mt-4 text-red-300">{error}</p> : null}
      {!agent && !error ? <div className="case-skeleton h-32 mt-6" /> : null}

      {agent && caseStub && slug ? (
        <div className="mt-6">
          <AgentWorkspace caseData={caseStub} chatOnly publicSlug={slug} />
          <p className="mt-4 text-center text-xs text-slate-500">
            Shared via MemGateQA · {agent.evidenceCount} facts · health {agent.lastScore ?? '—'}%
          </p>
        </div>
      ) : null}
    </div>
  );
}