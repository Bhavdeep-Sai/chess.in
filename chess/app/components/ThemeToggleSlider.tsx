'use client';

import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggleSlider: React.FC = () => {
  const { themeMode, setTheme } = useTheme();

  const themes = [
    {
      mode: 'light' as const,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Light',
      activeColor: 'bg-yellow-500 text-yellow-900',
      inactiveColor: 'text-gray-400'
    },
    {
      mode: 'dark' as const,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ),
      label: 'Dark',
      activeColor: 'bg-indigo-600 text-indigo-100',
      inactiveColor: 'text-gray-400'
    },
    {
      mode: 'system' as const,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
        </svg>
      ),
      label: 'System',
      activeColor: 'bg-purple-600 text-purple-100',
      inactiveColor: 'text-gray-400'
    }
  ];

  const currentIndex = themes.findIndex(theme => theme.mode === themeMode);
  const currentTheme = themes[currentIndex] || themes[0]; // Fallback to first theme if not found

  return (
    <div className="relative">
      {/* Main Toggle Container */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-gray-800/50 backdrop-blur-sm border border-white/10">
        {themes.map((theme, index) => {
          const isActive = theme.mode === themeMode;
          const isAdjacent = Math.abs(index - currentIndex) === 1;
          
          return (
            <button
              key={theme.mode}
              onClick={() => setTheme(theme.mode)}
              className={`
                relative p-2 rounded-full transition-all duration-300 ease-in-out
                ${isActive 
                  ? `${theme.activeColor} shadow-lg transform scale-110 z-10` 
                  : `${theme.inactiveColor} hover:bg-gray-700/50 hover:text-gray-200`
                }
                ${isAdjacent ? 'transform scale-105' : ''}
              `}
              title={`${theme.label} Mode`}
            >
              <div className={`
                transition-transform duration-200 
                ${isActive ? 'scale-110' : 'scale-100'}
              `}>
                {theme.icon}
              </div>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-current opacity-70"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sliding background indicator */}
      <div 
        className="absolute top-1 w-8 h-8 rounded-full bg-gradient-to-r from-white/20 to-white/10 
          transition-all duration-300 ease-in-out pointer-events-none border border-white/20"
        style={{
          left: `${4 + (currentIndex * 36)}px`,
          transform: 'scale(0.9)',
        }}
      />

      {/* Current mode label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <span className="text-xs font-medium text-gray-300 bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm">
          {currentTheme.label}
        </span>
      </div>
    </div>
  );
};

export default ThemeToggleSlider;
