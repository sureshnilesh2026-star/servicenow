import { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router';
import { BarChart3, Home, Moon, Sun } from 'lucide-react';

const THEME_KEY = 'clustering-study-theme';

export function AppLayout() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const shouldUseDark =
      savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <div className="relative">
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
          className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-neutral-100" />
          ) : (
            <Moon className="w-5 h-5 text-neutral-900" />
          )}
        </button>
        <Link
          to="/"
          aria-label="Go to home"
          title="Home"
          className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
        >
          <Home className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
        </Link>
        <Link
          to="/admin"
          aria-label="Open admin dashboard"
          title="Admin Dashboard"
          className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
        >
          <BarChart3 className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
        </Link>
      </div>

      <Outlet />
    </div>
  );
}
