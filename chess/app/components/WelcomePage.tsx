'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '../hooks/useTheme';

interface WelcomePageProps {
  onGetStarted: () => void;
}

export default function WelcomePage({ onGetStarted }: WelcomePageProps) {
  const { isDark, colors } = useTheme();
  
  return (
    <div className={`h-screen overflow-hidden relative ${colors.bg.primary}`}>
      {/* Chess Background Image */}
      <Image 
        src="/chessbg.jpg" 
        alt="chess background"
        fill
        className={`object-cover ${isDark ? 'opacity-80' : 'opacity-90'}`}
        priority
      />
      
      {/* Dark Overlay for Better Text Readability */}
      <div className={`absolute inset-0 ${isDark ? 'bg-black/50' : 'bg-black/40'}`}></div>
      
      {/* Welcome Message Overlay */}
      <div className="absolute inset-0 flex items-center justify-end px-4">
        <div className="max-w-9xl text-center">
          
          {/* Welcome Text */}
          <div className="mb-12">
            <h1 className={`text-5xl text-left md:text-7xl font-bold mb-6 drop-shadow-2xl ${colors.text.primary}`}>
              Play <span className="text-[#6adcdf]">Chess</span>.
            </h1>
            <h2 className={`text-4xl text-right md:text-6xl font-bold mb-6 drop-shadow-2xl ${colors.text.primary}`}>
              Strategize <span className="text-pink-500">Your</span> Mind.
            </h2>
            <h2 className={`text-4xl text-center md:text-6xl font-bold mb-8 drop-shadow-2xl ${isDark ? 'text-yellow-300' : 'text-yellow-400'}`}>
              Have fun
            </h2>
            
            <p className={`text-xl text-center md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed drop-shadow-lg ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
              Join thousands of players in the ultimate online chess experience. 
              Play against friends, challenge opponents worldwide, or practice your skills offline.
            </p>
          </div>

          {/* Get Started Button */}
          <button
            onClick={onGetStarted}
            className={`backdrop-blur-sm cursor-pointer text-white text-xl md:text-2xl font-semibold 
              px-12 py-4 rounded-xl transition-all duration-300 transform
              shadow-2xl focus:outline-none focus:ring-4 
              ${isDark 
                ? 'bg-yellow-500/90 hover:bg-yellow-600/90 hover:shadow-yellow-500/25 focus:ring-yellow-400/50' 
                : 'bg-yellow-400/95 hover:bg-yellow-500/95 hover:shadow-yellow-400/30 focus:ring-yellow-300/60'
              }`}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
