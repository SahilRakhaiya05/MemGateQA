import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/memgateqaApi';
import { ArcadeCabinet } from './arcade/ArcadeCabinet';
import { GoButton } from './arcade/GoButton';

const WOLF_STEPS = [
  { id: 'remember', label: 'remember()', icon: '🧠', path: '/cases/case-wolfpack/evidence' },
  { id: 'interrogate', label: 'recall()', icon: '🔍', path: '/cases/case-wolfpack/tests' },
  { id: 'surgery', label: 'improve+forget', icon: '🔧', path: '/cases/case-wolfpack/surgery' },
  { id: 'rerun', label: 'regression', icon: '♻️', path: '/cases/case-wolfpack/results' },
  { id: 'report', label: 'certificate', icon: '📋', path: '/cases/case-wolfpack/report' },
] as const;

const CASE_ID = 'case-wolfpack';

export function LifecycleRunner() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [log, setLog] = useState<string[]>([]);
  const [scoreBefore, setScoreBefore] = useState<number | null>(null);
  const [scoreAfter, setScoreAfter] = useState<number | null>(null);
  const [error, setError] = useState('');

  const push = (msg: string) => setLog((l) => [...l, msg]);

  const runFullPipeline = async () => {
    setRunning(true);
    setError('');
    setLog([]);
    setScoreBefore(null);
    setScoreAfter(null);

    try {
      setActiveStep(0);
      push('Indexing WolfPack evidence in Cognee…');
      navigate(WOLF_STEPS[0].path);
      const remembered = await api.remember(CASE_ID);
      push(`remember() → ${remembered.stored.length} items indexed`);

      setActiveStep(1);
      push('Running trap interrogation suite…');
      navigate(WOLF_STEPS[1].path);
      const interrogation = await api.interrogate(CASE_ID);
      setScoreBefore(interrogation.score);
      const fails = interrogation.results.filter((r) => r.status === 'fail').length;
      push(`recall() → Health ${interrogation.score}/100 · ${fails} failures`);

      setActiveStep(2);
      push('Applying human-approved memory surgery…');
      navigate(WOLF_STEPS[2].path);
      await api.surgery(CASE_ID, {
        dataset: 'memgateqa_wolfpack',
        instruction:
          'Final architecture: Next.js + Postgres + pgvector + Cognee Cloud. Supabase rejected. Presentation at 2 PM not 5 PM. Refuse private tokens. Honor forget requests.',
        evidenceIds: [],
      });

      setActiveStep(3);
      push('Rerunning regression suite…');
      navigate(WOLF_STEPS[3].path);
      const rerun = await api.rerun(CASE_ID);
      setScoreAfter(rerun.score);
      push(`Regression → Health ${rerun.score}/100`);

      setActiveStep(4);
      push('Generating Memory Health Certificate…');
      navigate(WOLF_STEPS[4].path);
      await api.report(CASE_ID);
      push('Certificate ready — deploy gate ' + (rerun.score >= 80 ? 'CLEARED' : 'BLOCKED'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pipeline failed — is the bridge running?');
      push('✕ ' + (err instanceof Error ? err.message : 'Failed'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <ArcadeCabinet compact subtitle="One-click full lifecycle run" title="WOLFPACK PIPELINE">
      <div className="lifecycle-runner">
        <div className="lifecycle-runner-header">
          <div>
            <p className="font-hud text-[10px] uppercase tracking-wider text-orange-300">Press GO — end-to-end QA run</p>
            <h3 className="font-sig text-xl font-bold text-white">WolfPack full lifecycle</h3>
            <p className="mt-1 text-sm text-slate-400">
              remember → interrogate → surgery → rerun → certificate
            </p>
          </div>
          <GoButton disabled={running} label={running ? '…' : 'GO'} loading={running} onClick={runFullPipeline} />
        </div>

        <div className="lifecycle-runner-track">
          {WOLF_STEPS.map((s, i) => (
            <div key={s.id} className={`lifecycle-runner-station ${i <= activeStep ? 'active' : ''} ${i < activeStep ? 'done' : ''}`}>
              <motion.span
                animate={i === activeStep && running ? { scale: [1, 1.15, 1] } : {}}
                className="lifecycle-runner-icon"
                transition={{ duration: 0.8, repeat: i === activeStep && running ? Infinity : 0 }}
              >
                {s.icon}
              </motion.span>
              <span className="lifecycle-runner-label">{s.label}</span>
              {i < WOLF_STEPS.length - 1 ? <div className="lifecycle-runner-connector" /> : null}
            </div>
          ))}
        </div>

        {scoreBefore != null || scoreAfter != null ? (
          <div className="lifecycle-runner-score-arc">
            {scoreBefore != null ? <span className="score-before">{scoreBefore}%</span> : null}
            {scoreBefore != null && scoreAfter != null ? <span className="score-arrow">→</span> : null}
            {scoreAfter != null ? <span className="score-after">{scoreAfter}%</span> : null}
          </div>
        ) : null}

        {log.length ? (
          <div className="lifecycle-runner-log">
            {log.map((line, i) => (
              <div key={i} className="lifecycle-runner-log-line">{line}</div>
            ))}
          </div>
        ) : null}

        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      </div>
    </ArcadeCabinet>
  );
}