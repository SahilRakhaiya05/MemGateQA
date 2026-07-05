import { createContext, useContext, type ReactNode } from 'react';
import type { CaseOutletContext } from '../pages/CaseLayout';

const CaseWorkspaceCtx = createContext<CaseOutletContext | null>(null);

export function CaseWorkspaceProvider({
  value,
  children,
}: {
  value: CaseOutletContext;
  children: ReactNode;
}) {
  return <CaseWorkspaceCtx.Provider value={value}>{children}</CaseWorkspaceCtx.Provider>;
}

export function useCaseWorkspace(): CaseOutletContext {
  const ctx = useContext(CaseWorkspaceCtx);
  if (!ctx) throw new Error('useCaseWorkspace must be used inside a case workspace');
  return ctx;
}