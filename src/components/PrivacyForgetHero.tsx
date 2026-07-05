import type { CaseRecord, TestResult } from '../api/memgateqaApi';

interface PrivacyForgetHeroProps {
  caseData: CaseRecord;
  results?: TestResult[];
}

const WEDGE_TESTS = ['test-token-leak', 'test-forget-phone'];

export function PrivacyForgetHero({ caseData, results }: PrivacyForgetHeroProps) {
  const active = results ?? caseData.resultsAfter ?? caseData.resultsBefore ?? [];
  const before = caseData.resultsBefore ?? [];
  if (!before.length) return null;

  const wedge = WEDGE_TESTS.map((id) => {
    const test = caseData.tests.find((t) => t.id === id);
    const b = before.find((r) => r.testId === id);
    const a = active.find((r) => r.testId === id);
    return { test, before: b, after: a };
  }).filter((x) => x.test);

  return (
    <section className="privacy-forget-hero">
      <div className="privacy-forget-hero-glow" />
      <div className="privacy-forget-hero-inner">
        <p className="font-hud text-[10px] uppercase tracking-[0.25em] text-rose-300">Privacy & deletion</p>
        <h2 className="font-sig text-2xl font-bold text-white md:text-3xl">
          Verified <span className="text-cyan-300">forget()</span> and secret leak traps
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Trap tests confirm private tokens stay out of recall and forgotten data cannot be retrieved — using Cognee
          NodeSet scoping and graph deletion, not just keyword filters.
        </p>
        <div className="privacy-forget-grid">
          {wedge.map(({ test, before: b, after: a }) => {
            const pass = a?.status === 'pass';
            const leaked = b?.actual?.includes('tw_live') || b?.actual?.includes('+1-555');
            return (
              <article key={test!.id} className={`privacy-forget-card ${pass ? 'cleared' : 'hot'}`}>
                <div className="privacy-forget-card-head">
                  <span className="privacy-forget-icon">{test!.category === 'privacy' ? '🔒' : '🗑️'}</span>
                  <div>
                    <h3 className="font-sig font-bold text-white">{test!.title}</h3>
                    <p className="font-hud text-[9px] uppercase text-slate-500">{test!.category} trap</p>
                  </div>
                  <span className={`privacy-forget-verdict ${pass ? 'pass' : 'fail'}`}>
                    {pass ? 'VERIFIED' : 'EXPOSED'}
                  </span>
                </div>
                <div className="privacy-forget-quote">
                  <div>
                    <span className="privacy-forget-label">Before</span>
                    <p className={leaked ? 'text-red-300' : 'text-slate-400'}>{b?.actual?.slice(0, 120)}…</p>
                  </div>
                  <div>
                    <span className="privacy-forget-label">After</span>
                    <p className="text-emerald-200">{a?.actual?.slice(0, 120) ?? '—'}…</p>
                  </div>
                </div>
                {test!.category === 'privacy' ? (
                  <p className="privacy-forget-meta">node_set:private · excludeNodeSets on recall</p>
                ) : (
                  <p className="privacy-forget-meta">forget(dataId) · negative recall proof</p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}