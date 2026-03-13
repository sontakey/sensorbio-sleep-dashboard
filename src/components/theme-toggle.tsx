'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'sensorbio_theme';

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'light') root.classList.add('light');
  else root.classList.remove('light');
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle-btn inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#1e293b] bg-transparent text-slate-200 hover:bg-white/5 transition"
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Dark mode' : 'Light mode'}
    >
      <span className="text-[16px] leading-none" aria-hidden>
        {isLight ? '☾' : '☀'}
      </span>
    </button>
  );
}
