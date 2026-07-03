import { Link } from 'react-router-dom';

export function EnterpriseHero() {
  return (
    <section className="ent-hero">
      <div className="ent-hero-grid">
        <div>
          <p className="font-hud text-[11px] uppercase tracking-[0.2em] text-cyan-400">
            Enterprise memory QA · Cognee Cloud
          </p>
          <h1 className="mt-3 font-sig text-4xl font-bold leading-tight text-white lg:text-5xl">
            Ship agent memory only after it passes the gate.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
            MemGateQA is a <strong className="font-medium text-slate-200">QA and compliance layer</strong> for
            Cognee-powered agents. Teams upload evidence, run automated trap tests against live{' '}
            <code className="font-hud text-cyan-300">recall()</code>, approve repairs, and export a Memory Health
            certificate before production deploy.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="ent-btn ent-btn-primary" to="/cases/new">
              Start memory audit
            </Link>
            <Link className="ent-btn ent-btn-secondary" to="/cases/case-wolfpack">
              View demo case
            </Link>
          </div>
        </div>
        <div className="ent-hero-cards">
          <HeroCard title="For platform teams" body="Gate agent releases on Memory Health Score ≥ 80 before deploy." />
          <HeroCard title="For compliance" body="Verify forget(), privacy refusal, and GDPR-style data removal." />
          <HeroCard title="For AI engineers" body="Regression suite after every memory surgery or dataset change." />
        </div>
      </div>
    </section>
  );
}

function HeroCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="ent-hero-card">
      <h3 className="font-sig text-sm font-bold uppercase tracking-wide text-cyan-200">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}