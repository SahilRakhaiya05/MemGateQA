import { SortationArena } from './arcade/SortationArena';
import { STATUS_TO_STATION, type StationId } from './factory/stations';
import type { BeltPacket } from './ConveyorBelt';

export type FactoryStationId = StationId;

interface FactoryFloorProps {
  caseId?: string;
  caseName?: string;
  dataset?: string;
  status: string;
  score?: number | null;
  scoreBefore?: number | null;
  compact?: boolean;
  failures?: number;
  evidence?: number;
  tests?: number;
  packets?: BeltPacket[];
  beltFast?: boolean;
  indexedCount?: number;
}

export function statusToStation(status: string): FactoryStationId {
  return STATUS_TO_STATION[status] ?? 'intake';
}

export function FactoryFloor(props: FactoryFloorProps) {
  return (
    <SortationArena
      beltFast={props.beltFast}
      caseId={props.caseId}
      caseName={props.caseName}
      compact={props.compact}
      dataset={props.dataset}
      evidenceCount={props.evidence}
      failures={props.failures}
      indexedCount={props.indexedCount}
      packets={props.packets}
      score={props.score}
      scoreBefore={props.scoreBefore}
      status={props.status}
      testsCount={props.tests}
    />
  );
}