export function ParticleField() {
  return (
    <div aria-hidden className="particle-field">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="particle"
          style={{
            '--x': `${(i * 17) % 100}%`,
            '--delay': `${(i * 0.7) % 12}s`,
            '--dur': `${8 + (i % 6)}s`,
            '--size': `${2 + (i % 3)}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}