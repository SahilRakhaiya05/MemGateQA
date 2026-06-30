import { Link, Outlet, useLocation } from 'react-router-dom';
import { MemoryLifecyclePills } from '../components/MemoryLifecyclePills';
import { useCogneeBridge } from '../hooks/useCogneeBridge';

export function AppShell() {
  const { health } = useCogneeBridge();
  const location = useLocation();
  const live = health?.cognee_reachable;

  return (
    <div className="min-h-screen text-slate-100">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.1),transparent_40%),linear-gradient(180deg,#0a0e17,#050711)]" />
      <div className="fixed inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative mx-auto max-w-[1520px] px-4 py-5 lg:px-8">
        <nav className="ent-nav mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link className="font-sig text-xl font-bold tracking-wide text-white" to="/">
              MemGate<span className="text-cyan-400">QA</span>
            </Link>
            <Link
              className={`text-sm font-medium ${location.pathname === '/' ? 'text-cyan-300' : 'text-slate-400 hover:text-white'}`}
              to="/"
            >
              Dashboard
            </Link>
            <Link
              className={`text-sm font-medium ${location.pathname === '/cases/new' ? 'text-cyan-300' : 'text-slate-400 hover:text-white'}`}
              to="/cases/new"
            >
              New audit
            </Link>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 font-hud text-[10px] uppercase tracking-wider">
              <span
                className={`rounded-full border px-3 py-1 ${live ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : health?.mode === 'mock' ? 'border-amber-400/30 text-amber-200' : 'border-orange-400/30 text-orange-200'}`}
              >
                {live ? 'Cognee Cloud live' : health?.mode === 'mock' ? 'Mock mode' : 'Bridge offline'}
              </span>
              {health?.case_count != null ? (
                <span className="text-slate-500">{health.case_count} audits</span>
              ) : null}
            </div>
            <MemoryLifecyclePills active={live ? ['remember', 'recall', 'improve', 'forget'] : []} />
          </div>
        </nav>

        <Outlet />
      </div>
    </div>
  );
}