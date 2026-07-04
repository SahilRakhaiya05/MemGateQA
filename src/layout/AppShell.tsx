import { Link, Outlet, useLocation } from 'react-router-dom';
import { CommandPalette, CommandPaletteTrigger } from '../components/CommandPalette';
import { DemoTour } from '../components/DemoTour';
import { FloatingDock } from '../components/FloatingDock';
import { LiveStatusBar } from '../components/LiveStatusBar';
import { MobileNav } from '../components/MobileNav';
import { ParticleField } from '../components/ParticleField';
import { SoundToggle } from '../components/SoundToggle';
import { ThemeToggle } from '../components/ThemeToggle';
import { useCogneeBridge } from '../hooks/useCogneeBridge';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '🏠', exact: true },
  { to: '/cases/new', label: 'New audit', icon: '➕', exact: false },
  { to: '/cases/case-wolfpack', label: 'WolfPack', icon: '🐺', exact: false },
] as const;

export function AppShell() {
  const { health } = useCogneeBridge();
  const location = useLocation();
  const live = health?.cognee_reachable;
  const inCase = location.pathname.startsWith('/cases/') && !location.pathname.endsWith('/new');

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen text-slate-100">
      <div className="ambient-bg" />
      <div className="ambient-grid" />
      <ParticleField />

      <div className="relative mx-auto max-w-[1520px] px-4 py-5 pb-24 lg:px-8 lg:pb-5">
        <nav className="ent-nav mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <Link className="flex items-center gap-3" to="/">
              <div className="brand-mark">
                <span className="brand-mark-inner">MQ</span>
              </div>
              <div className="flex flex-col">
                <span className="font-sig text-xl font-bold tracking-wide text-white">
                  MemGate<span className="text-theme-accent">QA</span>
                </span>
                <span className="font-hud text-[9px] uppercase tracking-wider text-slate-500">
                  Ship memory only after it passes the gate
                </span>
              </div>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  className={`nav-pill ${isActive(item.to, item.exact) ? 'active' : ''}`}
                  to={item.to}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <SoundToggle />
            <CommandPaletteTrigger />
            <span
              className={`status-chip ${live ? 'status-live' : health?.mode === 'mock' ? 'status-mock' : 'status-offline'}`}
            >
              <span className="status-chip-dot" />
              {live ? 'Cognee live' : health?.mode === 'mock' ? 'Mock mode' : 'Offline'}
            </span>
          </div>
        </nav>

        <LiveStatusBar health={health} showLifecycle={!inCase} />

        <main className="mt-6">
          <Outlet />
        </main>

        <footer className="app-footer">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-500">MemGateQA v1.2 · Enterprise QA layer for Cognee agent memory</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span><kbd className="cmd-kbd">Ctrl K</kbd> palette</span>
              <span><kbd className="cmd-kbd">`</kbd> API log</span>
            </div>
          </div>
        </footer>

        {inCase ? <FloatingDock /> : null}
        <MobileNav />
        <DemoTour />
        <CommandPalette />
      </div>
    </div>
  );
}