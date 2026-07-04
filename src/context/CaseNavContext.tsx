import { createContext, useContext, type ReactNode } from 'react';
import type { CaseRecord } from '../api/memgateqaApi';

export type CaseNavSnapshot = {
  caseId: string;
  caseData: CaseRecord;
  completed: boolean[];
  indexedCount: number;
  failures: number;
  shipReady: boolean;
};

const CaseNavContext = createContext<CaseNavSnapshot | null>(null);

export function CaseNavProvider({ value, children }: { value: CaseNavSnapshot; children: ReactNode }) {
  return <CaseNavContext.Provider value={value}>{children}</CaseNavContext.Provider>;
}

export function useCaseNav() {
  return useContext(CaseNavContext);
}