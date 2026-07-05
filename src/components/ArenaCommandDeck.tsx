import { useEffect, useState } from 'react';
import { api, type CaseRecord } from '../api/memgateqaApi';
import { SortationScoreboard } from './arcade/SortationScoreboard';
import { RoiPayoffCard } from './arcade/RoiPayoffCard';
import { TrapBeforeAfterSplit } from './TrapBeforeAfterSplit';
import { ProductCapabilitiesStrip } from './ProductCapabilitiesStrip';
import { JudgeDemoBanner } from './JudgeDemoBanner';

export function ArenaCommandDeck() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [wolfpack, setWolfpack] = useState<CaseRecord | null>(null);

  useEffect(() => {
    api.listCases().then(setCases).catch(() => setCases([]));
    api.getCase('case-wolfpack').then(setWolfpack).catch(() => setWolfpack(null));
  }, []);

  const featured = wolfpack ?? cases[0] ?? null;

  return (
    <div className="arena-command-deck space-y-6">
      <JudgeDemoBanner />
      <SortationScoreboard cases={cases} featured={featured} />
      <div className="arena-command-grid">
        <RoiPayoffCard cases={cases} />
        <ProductCapabilitiesStrip />
      </div>
      {wolfpack && (wolfpack.resultsBefore?.length ?? 0) > 0 ? (
        <div className="ent-card p-4">
          <TrapBeforeAfterSplit caseData={wolfpack} />
        </div>
      ) : null}
    </div>
  );
}