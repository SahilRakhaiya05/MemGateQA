import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { readLocal, writeLocal } from '../lib/safeStorage';

export type ThemeId = 'prism' | 'arena' | 'aurora';

const KEY = 'memgateqa-theme';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'prism',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = readLocal(KEY) as ThemeId | null;
    return saved ?? 'prism';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    writeLocal(KEY, theme);
  }, [theme]);

  const setTheme = (t: ThemeId) => setThemeState(t);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}