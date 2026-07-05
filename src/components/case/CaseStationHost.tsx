import { useEffect, useState, type ComponentType } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { CaseWorkspaceProvider } from '../../context/CaseWorkspaceContext';
import type { CaseOutletContext } from '../../pages/CaseLayout';
import { AgentPage } from '../../pages/AgentPage';
import { CaseChatPage } from '../../pages/CaseChatPage';
import { CaseDeskPage } from '../../pages/CaseDeskPage';
import { CaseGraphPage } from '../../pages/CaseGraphPage';
import { CaseOverviewPage } from '../../pages/CaseOverviewPage';
import { EvidencePage } from '../../pages/EvidencePage';
import { ReportPage } from '../../pages/ReportPage';
import { ResultsPage } from '../../pages/ResultsPage';
import { SurgeryPage } from '../../pages/SurgeryPage';
import { TestsPage } from '../../pages/TestsPage';
import type { CaseStationId } from './caseStations';
import { resolveCaseStation } from './caseStationRoute';

const STATION_PANELS: Record<CaseStationId, ComponentType> = {
  overview: CaseOverviewPage,
  graph: CaseGraphPage,
  chat: CaseChatPage,
  desk: CaseDeskPage,
  evidence: EvidencePage,
  tests: TestsPage,
  results: ResultsPage,
  surgery: SurgeryPage,
  report: ReportPage,
  agent: AgentPage,
};

interface CaseStationHostProps {
  workspace: CaseOutletContext;
}

/** Keep visited tabs mounted — only visibility changes, no full remount. */
export function CaseStationHost({ workspace }: CaseStationHostProps) {
  const location = useLocation();
  const { caseId } = useParams<{ caseId: string }>();
  const active = resolveCaseStation(location.pathname, caseId ?? '');
  const [mounted, setMounted] = useState<Set<CaseStationId>>(() => new Set([active]));

  useEffect(() => {
    setMounted((prev) => {
      if (prev.has(active)) return prev;
      const next = new Set(prev);
      next.add(active);
      return next;
    });
  }, [active]);

  return (
    <CaseWorkspaceProvider value={workspace}>
      <div className="case-station-host">
        {[...mounted].map((stationId) => {
          const Panel = STATION_PANELS[stationId];
          const isActive = stationId === active;
          return (
            <div
              key={stationId}
              aria-hidden={!isActive}
              className={`case-station-layer${isActive ? ' is-active' : ''}`}
            >
              <Panel />
            </div>
          );
        })}
      </div>
    </CaseWorkspaceProvider>
  );
}