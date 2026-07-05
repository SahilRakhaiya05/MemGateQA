import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaseFloorPicker } from '../components/case/CaseFloorPicker';
import { CaseGuideStrip } from '../components/case/CaseGuideStrip';
import { CaseHealthStrip } from '../components/case/CaseHealthStrip';
import { StudioPipelineStrip } from '../components/case/StudioPipelineStrip';
import { MemoryArena3D } from '../components/MemoryArena3D';
import { MemoryWikiHub } from '../components/MemoryWikiHub';
import { OverclockedLiveStage } from '../components/OverclockedLiveStage';
import { api, type CaseRecord } from '../api/memgateqaApi';
import { defaultFloorCaseId } from '../lib/demoCases';
import { BUILD, NAV, STUDIO } from '../copy/brand';

export function MemoryStudioPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [activeCaseId, setActiveCaseId] = useState('case-data-dna');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listCases()
      .then((list) => {
        setCases(list);
        if (list.length) setActiveCaseId(defaultFloorCaseId(list));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activeCase = cases.find((c) => c.id === activeCaseId);

  return (
    <div className="memory-studio-page mx-auto max-w-6xl space-y-5">
      <header className="vegas-hero text-left">
        <div className="vegas-marquee-lights justify-start" aria-hidden>
          <span /><span /><span /><span /><span />
        </div>
        <p className="vegas-hero-kicker text-left">{STUDIO.kicker}</p>
        <h1 className="vegas-hero-title text-left">{STUDIO.title}</h1>
        <p className="vegas-hero-sub text-left mx-0">{STUDIO.sub}</p>
        <div className="vegas-hero-actions justify-start">
          <Link className="vegas-neon-btn" to="/agents/create">
            {BUILD.title}
          </Link>
          <Link className="vegas-neon-btn cyan" to={`/cases/${activeCaseId}`}>
            Open case workspace →
          </Link>
        </div>
      </header>

      {error ? (
        <div className="error-banner">
          <p className="font-bold text-red-200">Server not running</p>
          <p className="mt-1 text-sm">
            Run <code className="font-hud">.\start.ps1</code> then refresh
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="case-skeleton h-20" />
      ) : cases.length > 0 ? (
        <CaseFloorPicker activeId={activeCaseId} cases={cases} onChange={setActiveCaseId} />
      ) : (
        <p className="text-sm text-slate-500">No agents yet — build one in chat.</p>
      )}

      {activeCase ? <CaseGuideStrip caseData={activeCase} compact /> : null}

      <OverclockedLiveStage caseId={activeCaseId} />

      {activeCase ? <CaseHealthStrip caseData={activeCase} caseId={activeCaseId} /> : null}

      <StudioPipelineStrip caseId={activeCaseId} />

      <MemoryArena3D caseId={activeCaseId} />

      <section>
        <MemoryWikiHub caseId={activeCaseId} compact />
      </section>

      <p className="memory-studio-foot text-center text-sm text-slate-500">
        Full audit workflow in{' '}
        <Link to={`/cases/${activeCaseId}`}>case workspace</Link> · same belt on{' '}
        <Link to="/">{NAV.home.label}</Link>
      </p>
    </div>
  );
}