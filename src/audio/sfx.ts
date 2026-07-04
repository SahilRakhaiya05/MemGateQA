let ctx: AudioContext | null = null;

function muted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('memgateqa-sfx-muted') === '1';
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined' || muted()) return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, when = 0) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ac.currentTime + when);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime + when);
  osc.stop(ac.currentTime + when + dur);
}

export function playThwack() {
  const ac = getCtx();
  if (!ac) return;
  tone(120, 0.08, 'square', 0.15);
  tone(80, 0.12, 'sawtooth', 0.1, 0.02);
  tone(200, 0.05, 'triangle', 0.06, 0.04);
}

export function playClear() {
  tone(523, 0.1, 'sine', 0.06);
  tone(659, 0.1, 'sine', 0.05, 0.08);
  tone(784, 0.15, 'sine', 0.04, 0.16);
}

export function playJam() {
  tone(90, 0.2, 'sawtooth', 0.1);
  tone(70, 0.25, 'square', 0.08, 0.05);
}

export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'sine', 0.07, i * 0.12));
}

export function playFail() {
  tone(300, 0.15, 'sawtooth', 0.08);
  tone(200, 0.25, 'sawtooth', 0.06, 0.1);
}