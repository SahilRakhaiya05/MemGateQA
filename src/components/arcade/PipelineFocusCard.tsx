import { motion } from 'framer-motion';
import { playThwack } from '../../audio/sfx';

const STEPS = ['Intake', 'Remember', 'Interrogate', 'Repair', 'Ship'] as const;

interface PipelineFocusCardProps {
  title: string;
  body: string;
  activeStep?: number;
  verdict?: 'ACCEPT' | 'REROUTE' | 'HOLD' | 'REFUSE' | null;
  fields?: { label: string; value: string }[];
}

export function PipelineFocusCard({
  title,
  body,
  activeStep = 0,
  verdict,
  fields = [],
}: PipelineFocusCardProps) {
  const showStamp = verdict != null;

  return (
    <div className="focus focus-card pipeline-focus">
      <div className="pipeline-pills">
        {STEPS.map((step, i) => (
          <span
            key={step}
            className={`pipeline-pill ${i < activeStep ? 'done' : ''} ${i === activeStep ? 'active' : ''}`}
          >
            {step}
          </span>
        ))}
      </div>

      <h3 className="font-sig text-base font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/90">{body}</p>

      {fields.length > 0 ? (
        <dl className="mt-3 space-y-1">
          {fields.map((f, i) => (
            <motion.div
              key={f.label}
              animate={{ opacity: 1, x: 0 }}
              className="pipeline-field"
              initial={{ opacity: 0, x: -8 }}
              transition={{ delay: i * 0.08 }}
            >
              <dt className="font-hud text-[8px] uppercase opacity-60">{f.label}</dt>
              <dd className="text-sm font-medium">{f.value}</dd>
            </motion.div>
          ))}
        </dl>
      ) : null}

      {showStamp ? (
        <motion.div
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          className={`pipeline-stamp stamp-${verdict!.toLowerCase()}`}
          initial={{ scale: 2.2, opacity: 0 }}
          onAnimationComplete={() => playThwack()}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          {verdict}
        </motion.div>
      ) : null}
    </div>
  );
}