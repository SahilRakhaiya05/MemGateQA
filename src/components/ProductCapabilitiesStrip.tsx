const CAPABILITIES = [
  'Obsidian graph search',
  'RAG vs graph compare',
  'Witness contradiction wall',
  'Recall trap runner',
  'Memory desk · ingest · query',
  'Live belt + GO audit',
  'forget() proof',
  'Ship health certificate',
] as const;

export function ProductCapabilitiesStrip() {
  return (
    <section className="product-capabilities">
      <p className="font-hud text-[10px] uppercase tracking-[0.2em] text-violet-300">Built in</p>
      <h2 className="font-sig text-lg font-bold text-white">Memory QA — not a demo wall</h2>
      <p className="mt-1 text-sm text-slate-400">
        Graph, traps, belt, compare, and ship-clear — one product, every agent.
      </p>
      <ul className="product-capabilities-pills">
        {CAPABILITIES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}