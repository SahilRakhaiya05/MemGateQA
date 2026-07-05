import { DeveloperHub } from '../components/DeveloperHub';
import { McpSdkWorkbench } from '../components/McpSdkWorkbench';

/** Optional integrations — not required for Cognee memory QA. */
export function DeveloperPage() {
  return (
    <div className="developer-page space-y-6">
      <header className="ent-card p-6">
        <p className="font-hud text-[10px] uppercase tracking-wider text-slate-500">Optional</p>
        <h1 className="font-sig text-2xl font-bold text-white">Integrations</h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl">
          Connect MemGateQA to Cursor, Claude, or your own agents via MCP and SDK. The web app runs full Cognee memory
          audits without any of this — use Overview → <strong className="text-white">Run memory audit</strong>.
        </p>
      </header>

      <div className="ent-card p-6">
        <McpSdkWorkbench caseId="case-wolfpack" />
      </div>

      <div className="ent-card p-6">
        <DeveloperHub caseId="case-wolfpack" />
      </div>
    </div>
  );
}