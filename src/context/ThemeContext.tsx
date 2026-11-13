import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'borrowbox_theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  return 'dark';
}

function applyThemeToDOM(_theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('dark');
  root.classList.remove('light');
  root.style.colorScheme = 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<Theme>('dark');

  // Lock to dark theme synchronously and save to localStorage
  useEffect(() => {
    applyThemeToDOM('dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } catch {}
  }, []);

  const setTheme = useCallback((_newTheme: Theme) => {
    applyThemeToDOM('dark');
  }, []);

  const toggleTheme = useCallback(() => {
    applyThemeToDOM('dark');
  }, []);

  const value = useMemo(
    () => ({
      theme: 'dark' as Theme,
      isDark: true,
      toggleTheme,
      setTheme,
    }),
    [toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

