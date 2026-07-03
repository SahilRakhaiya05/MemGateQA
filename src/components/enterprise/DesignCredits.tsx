/** Visual inspiration credits — MemGateQA is enterprise QA, not a game clone. */

const INSPIRATION_REPOS = [
  {
    name: "Let's Cook",
    url: 'https://github.com/aschahal/lets_cook',
    note: 'Phaser kitchen HUD patterns — station layout & warm palette (visual reference only)',
  },
  {
    name: 'overcooked-clone',
    url: 'https://github.com/Jvdputten/overcooked-clone',
    note: 'Unity Overcooked clone — assembly-line station topology',
  },
  {
    name: 'CookedUp',
    url: 'https://github.com/Farfi55/CookedUp',
    note: 'PlateUp/Overcooked thesis — delivery counter & bot workflow metaphor',
  },
  {
    name: 'HumanCompatibleAI/overcooked_ai',
    url: 'https://github.com/HumanCompatibleAI/overcooked_ai',
    note: 'Research Overcooked environment — multi-agent coordination analogy',
  },
];

export function DesignCredits() {
  return (
    <section className="ent-credits">
      <h2 className="font-sig text-lg font-bold text-white">Design inspiration (not a game product)</h2>
      <p className="mt-2 text-sm text-slate-400">
        MemGateQA borrows the <em>factory assembly-line metaphor</em> from Overcooked-style open source projects —
        warm station layout, work orders, conveyor intake — adapted for{' '}
        <strong className="text-slate-300">enterprise memory QA</strong>. There is no gameplay, no chef movement, no
        score-chasing timer. Users and enterprises get a real audit tool.
      </p>
      <ul className="mt-4 space-y-3">
        {INSPIRATION_REPOS.map((repo) => (
          <li key={repo.url} className="ent-credit-row">
            <a className="font-sig font-bold text-cyan-300 hover:underline" href={repo.url} rel="noreferrer" target="_blank">
              {repo.name} ↗
            </a>
            <span className="mt-1 block text-xs text-slate-500">{repo.note}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-hud text-[10px] text-slate-600">
        Cognee hackathon track: Best Use of Cognee Cloud · Built with remember / recall / improve / forget
      </p>
    </section>
  );
}