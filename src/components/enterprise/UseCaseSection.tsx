const USE_CASES = [
  {
    title: 'Pre-deploy memory gate',
    audience: 'Platform / SRE',
    problem: 'Agents ship with stale facts, leaked secrets, or broken forget.',
    solution: 'Run trap tests → get Memory Health Score → block deploy if below threshold.',
    ops: ['remember', 'recall', 'report'],
  },
  {
    title: 'Compliance & privacy audit',
    audience: 'Security / Legal',
    problem: 'No proof that PII was actually removed from agent memory.',
    solution: 'Privacy + forget test categories with before/after proof export.',
    ops: ['forget', 'recall', 'report'],
  },
  {
    title: 'Post-incident memory repair',
    audience: 'AI / ML engineers',
    problem: 'Bad memory caused wrong answers; need surgical fix + regression.',
    solution: 'Human-approved surgery (improve + forget) then automated rerun suite.',
    ops: ['improve', 'forget', 'recall'],
  },
  {
    title: 'Vendor evaluation',
    audience: 'Cognee Cloud users',
    problem: 'Judges need live proof you use full Cognee lifecycle deeply.',
    solution: 'WolfPack reference case + Cognee API receipts + graph + RAG vs Graph compare.',
    ops: ['remember', 'recall', 'improve', 'forget'],
  },
];

export function UseCaseSection() {
  return (
    <section className="ent-use-cases">
      <h2 className="font-sig text-xl font-bold text-white">Who uses MemGateQA</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Creative factory metaphor — serious enterprise outcomes. Same workflow whether you audit one agent or a fleet.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {USE_CASES.map((uc) => (
          <article key={uc.title} className="ent-use-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-sig font-bold text-white">{uc.title}</h3>
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 font-hud text-[9px] uppercase text-cyan-300">
                {uc.audience}
              </span>
            </div>
            <p className="mt-3 text-sm text-red-300/90">
              <span className="font-hud text-[9px] uppercase text-slate-500">Problem · </span>
              {uc.problem}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              <span className="font-hud text-[9px] uppercase text-slate-500">Solution · </span>
              {uc.solution}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {uc.ops.map((op) => (
                <span key={op} className="rounded bg-white/5 px-2 py-0.5 font-hud text-[10px] text-slate-400">
                  {op}()
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}