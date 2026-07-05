import { CASE_STATIONS, stationById, type CaseStationId } from './caseStations';

export function resolveCaseStation(pathname: string, caseId: string): CaseStationId {
  const base = `/cases/${caseId}`;
  if (pathname === base || pathname === `${base}/`) return 'overview';
  const suffix = pathname.startsWith(`${base}/`) ? pathname.slice(base.length + 1) : '';
  const segment = suffix.split('/')[0] ?? '';
  const hit = CASE_STATIONS.find((s) => s.path === segment);
  return hit?.id ?? 'overview';
}

export function stationHref(caseId: string, stationId: CaseStationId): string {
  const station = stationById(stationId);
  const base = `/cases/${caseId}`;
  return station.path ? `${base}/${station.path}` : base;
}