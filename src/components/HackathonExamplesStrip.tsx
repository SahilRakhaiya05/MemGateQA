const EXAMPLES = [
  {
    n: '01',
    title: 'Personal memory agents',
    body: 'Remember every conversation, preference, and decision across infinite sessions.',
  },
  {
    n: '02',
    title: 'Research copilots',
    body: 'Ingest docs into a living Cognee graph — recall with deep traversals.',
  },
  {
    n: '03',
    title: 'Never-forget workflows',
    body: 'Pipelines that carry context between runs and act smarter today.',
  },
  {
    n: '04',
    title: 'Self-improving agents',
    body: 'improve() / memify() enrich memory from feedback — sharper every session.',
  },
  {
    n: '05',
    title: 'Support memory',
    body: 'Full customer history in recall() — no more repeat account questions.',
  },
  {
    n: '06',
    title: 'Learning tutors',
    body: 'Track what learners know, adapt pace, build a personalized graph.',
  },
] as const;

export function HackathonExamplesStrip() {
  return (
    <section className="hackathon-examples">
      <h2>Hackathon inspiration — all in one agent</h2>
      <p className="text-sm text-slate-500">
        Six agent patterns — personal memory, research, workflows, tutoring, support, and self-improvement — in one Cognee-powered template.
      </p>
      <div className="hackathon-examples-grid">
        {EXAMPLES.map((ex) => (
          <article className="hackathon-example-card" key={ex.n}>
            <strong>#{ex.n} {ex.title}</strong>
            <span>{ex.body}</span>
          </article>
        ))}
      </div>
    </section>
  );
}