import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BUILD, NAV } from '../copy/brand';

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  path: string;
  group: string;
}

const COMMANDS: Command[] = [
  { id: 'dash', label: 'Home', hint: 'Live belt + agents', icon: '🏠', path: '/', group: 'Navigate' },
  { id: 'create-agent', label: BUILD.title, hint: BUILD.chatSub, icon: '➕', path: '/agents/create', group: 'Navigate' },
  { id: 'studio', label: NAV.studio.label, hint: NAV.studio.hint, icon: '◈', path: '/studio', group: 'Navigate' },
  { id: 'wolf', label: 'WolfPack demo', hint: 'Full ship-clear loop', icon: '🐺', path: '/cases/case-wolfpack', group: 'Navigate' },
  { id: 'wolf-ev', label: 'WolfPack evidence', icon: '📥', path: '/cases/case-wolfpack/evidence', group: 'WolfPack' },
  { id: 'wolf-test', label: 'WolfPack recall checks', icon: '🔍', path: '/cases/case-wolfpack/tests', group: 'WolfPack' },
  { id: 'wolf-res', label: 'WolfPack results', icon: '⚖️', path: '/cases/case-wolfpack/results', group: 'WolfPack' },
  { id: 'wolf-surg', label: 'WolfPack repair', icon: '🔧', path: '/cases/case-wolfpack/surgery', group: 'WolfPack' },
  { id: 'wolf-rep', label: 'WolfPack certificate', icon: '📋', path: '/cases/case-wolfpack/report', group: 'WolfPack' },
  { id: 'wolf-agent', label: 'WolfPack RUN ALL', hint: 'Autonomous belt', icon: '🤖', path: '/cases/case-wolfpack/agent', group: 'WolfPack' },
  { id: 'settings', label: NAV.settings.label, hint: 'Keys · models · webhooks', icon: '⚙️', path: '/settings', group: 'Navigate' },
  { id: 'dev', label: 'Integrations', icon: '🔌', path: '/developer', group: 'Advanced' },
  { id: 'evidence-live', label: 'Run live evidence (CLI)', hint: 'npm run evidence:live', icon: '📊', path: '/cases/case-wolfpack/report', group: 'Actions' },
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

  useEffect(() => {
    setActive(0);
  }, [query]);

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
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cmd-palette-search">
              <span className="cmd-palette-icon">⌕</span>
              <input
                autoFocus
                className="cmd-palette-input"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump anywhere…"
                value={query}
              />
            </div>
            <ul className="cmd-palette-list">
              {filtered.map((cmd, i) => (
                <li key={cmd.id}>
                  <button
                    className={`cmd-palette-item ${i === active ? 'active' : ''}`}
                    onClick={() => run(cmd)}
                    type="button"
                  >
                    <span className="cmd-palette-icon">{cmd.icon}</span>
                    <span className="cmd-palette-label">{cmd.label}</span>
                    {cmd.hint ? <span className="cmd-palette-hint">{cmd.hint}</span> : null}
                    <span className="cmd-palette-group">{cmd.group}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="cmd-palette-footer">
              <span><kbd className="cmd-kbd">↑↓</kbd> navigate</span>
              <span><kbd className="cmd-kbd">Enter</kbd> go</span>
              <span><kbd className="cmd-kbd">Esc</kbd> close</span>
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
      className="cmd-palette-trigger"
      onClick={() => window.dispatchEvent(new Event('memgateqa:cmd-open'))}
      type="button"
    >
      <kbd className="cmd-kbd">Ctrl K</kbd>
    </button>
  );
}