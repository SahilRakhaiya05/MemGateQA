import { useTheme, type ThemeId } from '../theme/ThemeContext';

const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: 'prism', label: 'Prism', swatch: '#8B5CF6' },
  { id: 'arena', label: 'Arena', swatch: '#EF5A2A' },
  { id: 'aurora', label: 'Aurora', swatch: '#34D399' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle" title="Color theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          aria-label={t.label}
          className={`theme-swatch ${theme === t.id ? 'active' : ''}`}
          onClick={() => setTheme(t.id)}
          style={{ '--swatch': t.swatch } as React.CSSProperties}
          type="button"
        />
      ))}
    </div>
  );
}