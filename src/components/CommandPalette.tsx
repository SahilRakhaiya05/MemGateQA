import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  path: string;
  group: string;
}

const COMMANDS: Command[] = [
  { id: 'dash', label: 'Dashboard', hint: 'All memory audits', icon: '🏠', path: '/', group: 'Navigate' },
  { id: 'new', label: 'New audit', hint: 'Create QA case', icon: '➕', path: '/cases/new', group: 'Navigate' },
  { id: 'wolf', label: 'WolfPack reference case', hint: 'Full QA lifecycle', icon: '🐺', path: '/cases/case-wolfpack', group: 'Navigate' },
  { id: 'wolf-ev', label: 'WolfPack evidence', icon: '📥', path: '/cases/case-wolfpack/evidence', group: 'WolfPack' },
  { id: 'wolf-test', label: 'WolfPack tests', icon: '🔍', path: '/cases/case-wolfpack/tests', group: 'WolfPack' },
  { id: 'wolf-res', label: 'WolfPack results', icon: '⚖️', path: '/cases/case-wolfpack/results', group: 'WolfPack' },
  { id: 'wolf-surg', label: 'WolfPack repair', icon: '🔧', path: '/cases/case-wolfpack/surgery', group: 'WolfPack' },
  { id: 'wolf-rep', label: 'WolfPack certificate', icon: '📋', path: '/cases/case-wolfpack/report', group: 'WolfPack' },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.hint?.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q),
    );
  }, [query]);

  const run = useCallback(
    (cmd: Command) => {
      setOpen(false);
      setQuery('');
      navigate(cmd.path);
    },
    [navigate],
  );

  useEffect(() => {
    const toggle = () => {
      setOpen((v) => !v);
      setActive(0);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    const onOpen = () => toggle();
    window.addEventListener('keydown', onKey);
    window.addEventListener('memgateqa:cmd-open', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('memgateqa:cmd-open', onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[active]) {
        e.preventDefault();
        run(filtered[active]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, active, run]);

  useEffect(() => setActive(0), [query]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="cmd-palette-overlay"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="cmd-palette"
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cmd-palette-search">
              <span className="text-cyan-400">⌘</span>
              <input
                autoFocus
                className="cmd-palette-input"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to page, station, or audit…"
                value={query}
              />
              <kbd className="cmd-kbd">ESC</kbd>
            </div>
            <div className="cmd-palette-list">
              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">No matches</p>
              ) : (
                filtered.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    className={`cmd-palette-item ${i === active ? 'active' : ''}`}
                    onClick={() => run(cmd)}
                    onMouseEnter={() => setActive(i)}
                    type="button"
                  >
                    <span className="cmd-palette-icon">{cmd.icon}</span>
                    <span className="flex-1 text-left">
                      <span className="block text-sm font-medium text-white">{cmd.label}</span>
                      {cmd.hint ? <span className="block text-xs text-slate-500">{cmd.hint}</span> : null}
                    </span>
                    <span className="font-hud text-[9px] uppercase text-slate-600">{cmd.group}</span>
                  </button>
                ))
              )}
            </div>
            <div className="cmd-palette-footer">
              <span><kbd className="cmd-kbd">↑↓</kbd> navigate</span>
              <span><kbd className="cmd-kbd">↵</kbd> open</span>
              <span><kbd className="cmd-kbd">Ctrl K</kbd> toggle</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function CommandPaletteTrigger() {
  return (
    <button
      className="cmd-trigger"
      onClick={() => window.dispatchEvent(new Event('memgateqa:cmd-open'))}
      title="Command palette (Ctrl+K)"
      type="button"
    >
      <span className="text-slate-500">Search</span>
      <kbd className="cmd-kbd">Ctrl K</kbd>
    </button>
  );
}