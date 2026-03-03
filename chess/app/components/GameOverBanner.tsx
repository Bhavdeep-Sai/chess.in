'use client';

import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface GameOverBannerProps {
  winner: 'white' | 'black' | 'draw' | null;
  reason: string | null;
  playerColor: 'white' | 'black' | null;
  whiteUsername?: string;
  blackUsername?: string;
  onPlayAgain?: () => void;
  onReturnToLobby: () => void;
  rematchRequested?: boolean;
  opponentRematchRequested?: boolean;
  onCancelRematch?: () => void;
}

const GameOverBanner: React.FC<GameOverBannerProps> = ({
  winner,
  reason,
  playerColor,
  whiteUsername = 'White',
  blackUsername = 'Black',
  onPlayAgain,
  onReturnToLobby,
  rematchRequested = false,
  opponentRematchRequested = false,
  onCancelRematch
}) => {
  const { colors } = useTheme();

  console.log('🎯 GameOverBanner rendered with:', { winner, reason, playerColor });

  const getResultMessage = () => {
    if (winner === 'draw') {
      const reasonText = reason === 'stalemate' ? 'Stalemate' 
                       : reason === 'draw_agreed' ? 'Draw by Agreement'
                       : reason === 'draw' ? 'Draw'
                       : 'Game Drawn';
      return {
        title: 'Game Drawn',
        subtitle: reasonText,
        icon: '🤝',
        color: 'yellow',
        bgGradient: 'from-yellow-500 to-amber-500'
      };
    }

    const isPlayerWinner = winner === playerColor;
    const winnerName = winner === 'white' ? whiteUsername : blackUsername;
    
    const reasonText = reason === 'checkmate' ? 'Checkmate'
                     : reason === 'resignation' ? 'Resignation'
                     : reason === 'timeout' ? 'Timeout'
                     : reason === 'abandoned' ? 'Opponent Left'
                     : '';

    if (isPlayerWinner) {
      return {
        title: 'Victory!',
        subtitle: `${reasonText ? 'By ' + reasonText : 'You Win'}`,
        icon: '👑',
        color: 'green',
        bgGradient: 'from-green-500 to-emerald-500'
      };
    } else {
      return {
        title: 'Defeat',
        subtitle: `${winnerName} Wins${reasonText ? ' by ' + reasonText : ''}`,
        icon: '💔',
        color: 'red',
        bgGradient: 'from-red-500 to-rose-500'
      };
    }
  };

  const result = getResultMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm animate-fadeIn">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100`}>
        {/* Result Icon & Title */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${result.bgGradient} mb-4 animate-bounce`}>
            <span className="text-4xl">{result.icon}</span>
          </div>
          <h2 className={`text-4xl font-bold mb-2 ${
            result.color === 'green' ? 'text-green-600 dark:text-green-400' :
            result.color === 'red' ? 'text-red-600 dark:text-red-400' :
            'text-yellow-600 dark:text-yellow-400'
          }`}>
            {result.title}
          </h2>
          <p className={`text-xl ${colors.text.secondary}`}>
            {result.subtitle}
          </p>
        </div>

        {/* Divider */}
        <div className={`border-t ${colors.border.primary} my-6`}></div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {onPlayAgain && (
            <div>
              <button
                onClick={rematchRequested ? onCancelRematch : onPlayAgain}
                className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  rematchRequested 
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white'
                    : opponentRematchRequested
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white animate-pulse'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                }`}
              >
                {rematchRequested 
                  ? '⏳ Waiting for Opponent... (Click to Cancel)'
                  : opponentRematchRequested
                  ? '✨ Accept Rematch'
                  : '♟️ Request Rematch'
                }
              </button>
              {(rematchRequested || opponentRematchRequested) && (
                <p className="text-sm text-center mt-2 text-gray-600 dark:text-gray-400">
                  {rematchRequested && !opponentRematchRequested && 'Waiting for opponent to accept...'}
                  {opponentRematchRequested && !rematchRequested && 'Your opponent wants a rematch!'}
                  {rematchRequested && opponentRematchRequested && 'Starting rematch...'}
                </p>
              )}
            </div>
          )}
          <button
            onClick={onReturnToLobby}
            className={`w-full ${colors.button.secondary} ${colors.text.primary} font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 border-2 ${colors.border.primary}`}
          >
            Return to Lobby
          </button>
        </div>

        {/* Game Info */}
        <div className={`mt-6 p-4 ${colors.bg.tertiary} rounded-lg`}>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white border-2 border-gray-400 rounded"></div>
              <span className={colors.text.secondary}>{whiteUsername}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={colors.text.secondary}>{blackUsername}</span>
              <div className="w-3 h-3 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverBanner;
