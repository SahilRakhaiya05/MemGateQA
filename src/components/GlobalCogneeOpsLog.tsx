import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CogneeOpsLog } from './CogneeOpsLog';

/** Backtick (`) toggles live Cognee API receipts — works on any route. */
export function GlobalCogneeOpsLog() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const caseMatch = location.pathname.match(/\/cases\/([^/]+)/);
  const caseId = caseMatch?.[1] ?? 'case-wolfpack';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return <CogneeOpsLog caseId={caseId} onToggle={() => setOpen((v) => !v)} open={open} />;
}