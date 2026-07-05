import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type CaseRecord } from '../api/memgateqaApi';
import { sortCasesForFloor } from '../lib/demoCases';
import { BRAND, BUILD, NAV } from '../copy/brand';

export function DashboardPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listCases()
      .then(setCases)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const featured = sortCasesForFloor(cases).slice(0, 4);

  return (
    <div className="dashboard-simple">
      <header className="vegas-hero">
        <div className="vegas-marquee-lights" aria-hidden>
          <span /><span /><span /><span /><span />
        </div>
        <p className="vegas-hero-kicker">{BRAND.hackathon}</p>
        <h1 className="vegas-hero-title">{BRAND.heroTitle}</h1>
        <p className="vegas-hero-sub">{BRAND.heroSub}</p>
        <p className="mt-2 text-sm text-slate-400">{BRAND.tagline}</p>
      </header>

      <Link className="home-action-card primary mb-6" to="/agents">
        <span className="home-action-icon">🤖</span>
        <span className="home-action-title">Open My agents</span>
        <span className="home-action-hint">
          Deep Research, Atlas, Mnemosyne, WolfPack, Clinical DNA — chat, audit, and share links
        </span>
      </Link>

      {error ? (
        <div className="error-banner">
          <p className="font-bold text-red-200">Server not running</p>
          <p className="mt-1 text-sm">
            Run <code className="font-hud">.\start.ps1</code> then refresh
          </p>
        </div>
      ) : null}

      <div className="home-action-grid">
        <Link className="home-action-card primary" to="/agents/create">
          <span className="home-action-icon">💬</span>
          <span className="home-action-title">{BUILD.title}</span>
          <span className="home-action-hint">Chat → Cognee memory → recall traps</span>
        </Link>
        <Link className="home-action-card" to="/studio">
          <span className="home-action-icon">◈</span>
          <span className="home-action-title">{NAV.studio.label}</span>
          <span className="home-action-hint">Live belt · graph · compare · desk</span>
        </Link>
        <Link className="home-action-card" to="/agents">
          <span className="home-action-icon">🤖</span>
          <span className="home-action-title">{NAV.agents.label}</span>
          <span className="home-action-hint">Health scores · share links · audit</span>
        </Link>
      </div>

      <section className="home-agents-preview">
        <div className="home-agents-preview-head">
          <h2 className="font-sig text-lg font-bold text-white">Your agents</h2>
          <Link className="ent-btn ent-btn-secondary ent-btn-sm" to="/agents">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="case-skeleton h-24" />
        ) : featured.length === 0 ? (
          <p className="text-sm text-slate-500">No agents yet — build one in chat.</p>
        ) : (
          <div className="home-agents-preview-grid">
            {featured.map((c) => {
              const ship = (c.lastScore ?? 0) >= 80;
              return (
                <Link key={c.id} className="home-agent-preview-card" to={`/cases/${c.id}`}>
                  <div className="home-agent-preview-top">
                    <strong className="home-agent-preview-name">{c.agent || c.name}</strong>
                    <span className={`home-agent-preview-score ${ship ? 'clear' : ''}`}>
                      {c.lastScore != null ? `${c.lastScore}%` : '—'}
                    </span>
                  </div>
                  <p className="home-agent-preview-meta">
                    {c.evidence.length} evidence · {c.tests.length} traps
                    {ship ? ' · ship clear' : ''}
                  </p>
                  <span className="home-agent-preview-cta">Open workspace →</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}