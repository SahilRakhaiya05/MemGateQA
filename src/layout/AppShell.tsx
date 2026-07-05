import { Link, Outlet, useLocation } from 'react-router-dom';
import { CommandPalette, CommandPaletteTrigger } from '../components/CommandPalette';
import { MobileNav } from '../components/MobileNav';
import { SoundToggle } from '../components/SoundToggle';
import { ThemeToggle } from '../components/ThemeToggle';
import { GlobalCogneeOpsLog } from '../components/GlobalCogneeOpsLog';
import { BridgeStaleBanner } from '../components/BridgeStaleBanner';
import { BRAND, NAV } from '../copy/brand';

const NAV_ITEMS = [
  { to: '/', label: NAV.home.label, icon: '🏠', exact: true, hint: NAV.home.hint },
  { to: '/studio', label: NAV.studio.label, icon: '◈', exact: false, hint: NAV.studio.hint },
  { to: '/agents', label: NAV.agents.label, icon: '🤖', exact: false, hint: NAV.agents.hint },
  { to: '/agents/create', label: NAV.create.label, icon: '➕', exact: false, hint: NAV.create.hint },
  { to: '/settings', label: NAV.settings.label, icon: '⚙️', exact: false, hint: NAV.settings.hint },
] as const;

export function AppShell() {
  const location = useLocation();

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen text-slate-100">
      <div className="ambient-bg" />
      <div className="ambient-grid" />
      <div className="relative mx-auto max-w-[1200px] px-4 py-5 pb-24 lg:px-8 lg:pb-5">
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
                  {BRAND.navTagline}
                </span>
              </div>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  className={`nav-pill ${isActive(item.to, item.exact) ? 'active' : ''}`}
                  title={item.hint}
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
          </div>
        </nav>

        <BridgeStaleBanner />

        <main className="mt-6">
          <Outlet />
        </main>

        <footer className="app-footer">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              {BRAND.name} · {BRAND.tagline}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span><kbd className="cmd-kbd">Ctrl K</kbd> jump anywhere</span>
              <span><kbd className="cmd-kbd">`</kbd> API receipts</span>
            </div>
          </div>
        </footer>

        <MobileNav />
        <CommandPalette />
        <GlobalCogneeOpsLog />
      </div>
    </div>
  );
}