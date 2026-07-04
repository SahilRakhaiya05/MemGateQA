import confetti from 'canvas-confetti';
import { playWin } from '../audio/sfx';

export function celebrateClear() {
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#00f5ff', '#22ff88', '#ff6b2c', '#b44dff'],
  });
}

export function celebrateShip() {
  const end = Date.now() + 1200;
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#22ff88', '#00f5ff', '#ffc947'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#22ff88', '#00f5ff', '#ffc947'],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
  playWin();
}