import { type CaseRecord } from '../api/memgateqaApi';
import { AgentShareQuick } from './AgentShareQuick';

interface AgentPublishPanelProps {
  caseData: CaseRecord;
  onPublished?: () => void;
}

export function AgentPublishPanel({ caseData, onPublished }: AgentPublishPanelProps) {
  return (
    <div className="agent-publish-panel space-y-3">
      <div>
        <p className="font-hud text-[10px] uppercase tracking-wider text-emerald-300">Share</p>
        <h3 className="font-sig text-lg font-bold text-white">Publish agent link</h3>
        <p className="mt-1 text-sm text-slate-400">
          Anyone with the link can chat — private evidence stays redacted on the public page.
        </p>
      </div>
      <AgentShareQuick
        agent={{
          id: caseData.id,
          agent: caseData.agent || caseData.name,
          publishSlug: caseData.publishSlug,
          visibility: caseData.visibility,
          sharePath:
            caseData.publishSlug && caseData.visibility !== 'private'
              ? `/share/${caseData.publishSlug}`
              : null,
        }}
        onUpdated={onPublished}
      />
    </div>
  );
}