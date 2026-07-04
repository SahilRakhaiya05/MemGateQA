import { useEffect, useState } from 'react';

const KEY = 'memgateqa-sfx-muted';

export function isSfxMuted(): boolean {
  return localStorage.getItem(KEY) === '1';
}

export function setSfxMuted(muted: boolean) {
  localStorage.setItem(KEY, muted ? '1' : '0');
  window.dispatchEvent(new Event('memgateqa:sfx-toggle'));
}

export function SoundToggle() {
  const [muted, setMuted] = useState(() => isSfxMuted());

  useEffect(() => {
    const sync = () => setMuted(isSfxMuted());
    window.addEventListener('memgateqa:sfx-toggle', sync);
    return () => window.removeEventListener('memgateqa:sfx-toggle', sync);
  }, []);

  return (
    <button
      className="sound-toggle"
      onClick={() => {
        const next = !muted;
        setMuted(next);
        setSfxMuted(next);
      }}
      title={muted ? 'Enable sound' : 'Mute sound'}
      type="button"
    >
      {muted ? '🔇' : '🔊'}
      <span className="hidden sm:inline">{muted ? 'Muted' : 'SFX on'}</span>
    </button>
  );
}