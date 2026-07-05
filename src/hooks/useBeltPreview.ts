import { useEffect, useRef, useState } from 'react';

const PREVIEW_DONE_KEY = (caseId: string) => `belt-preview-done-${caseId}`;
const PREVIEW_MS = 1200;

/** One-time memory read on open — cycles packets once, then stops (no loop). */
export function useBeltPreview(caseId: string | undefined, packetIds: string[], gateRunning: boolean) {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    clearTimers();
    if (!caseId || gateRunning || packetIds.length === 0) {
      setActive(false);
      return;
    }

    try {
      if (sessionStorage.getItem(PREVIEW_DONE_KEY(caseId)) === '1') {
        setActive(false);
        return;
      }
    } catch {
      /* ignore */
    }

    setActive(true);
    setIndex(0);
    let step = 0;

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.current.push(id);
    };

    const runStep = () => {
      setIndex(step);
      step += 1;
      if (step < packetIds.length) {
        schedule(runStep, PREVIEW_MS);
      } else {
        schedule(() => {
          setActive(false);
          try {
            sessionStorage.setItem(PREVIEW_DONE_KEY(caseId), '1');
          } catch {
            /* ignore */
          }
        }, PREVIEW_MS);
      }
    };

    schedule(runStep, 400);

    return clearTimers;
  }, [caseId, packetIds.length, gateRunning]);

  const focusId = active ? packetIds[index] ?? null : null;

  return { previewActive: active, previewFocusId: focusId };
}