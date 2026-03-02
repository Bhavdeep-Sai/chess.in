'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  themeMode: 'light' | 'dark' | 'auto';
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark' | 'auto') => void;
  colors: any;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  themeMode: 'auto',
  toggleTheme: () => {},
  setTheme: () => {},
  colors: {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('auto');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('chess-theme-mode') as 'light' | 'dark' | 'auto' | null;
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateSystemTheme = () => {
      if (themeMode === 'auto') {
        setIsDark(mediaQuery.matches);
      }
    };

    if (themeMode === 'auto') {
      setIsDark(mediaQuery.matches);
    } else {
      setIsDark(themeMode === 'dark');
    }

    mediaQuery.addEventListener('change', updateSystemTheme);
    
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('chess-theme-mode', themeMode);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode, isDark]);

  const toggleTheme = () => {
    const modes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100',
      secondary: isDark ? 'bg-gray-800' : 'bg-white',
      tertiary: isDark ? 'bg-gray-700' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    },
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500',
      accent: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    border: {
      primary: isDark ? 'border-gray-600' : 'border-gray-300',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    card: {
      background: isDark ? 'bg-gray-800' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
    },
    button: {
      primary: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700',
      secondary: isDark ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-600 hover:bg-gray-700',
      danger: isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700',
      success: isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700',
      ghost: isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200',
    },
    chess: {
      lightSquare: isDark ? 'bg-amber-200' : 'bg-amber-100',
      darkSquare: isDark ? 'bg-amber-800' : 'bg-amber-600',
      highlight: isDark ? 'bg-yellow-500 bg-opacity-60' : 'bg-yellow-400 bg-opacity-50',
      lastMove: isDark ? 'bg-green-500 bg-opacity-40' : 'bg-green-400 bg-opacity-30',
      check: isDark ? 'border-2 border-red-500 ' : 'border-2 border-red-500',
      possibleMove: isDark ? 'bg-blue-500 bg-opacity-40' : 'bg-blue-400 bg-opacity-30',
      capture: isDark ? 'bg-red-500 bg-opacity-50' : 'bg-red-400 bg-opacity-40',
    },
  };

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, toggleTheme, setTheme: setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
