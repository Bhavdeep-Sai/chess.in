'use client';

import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface MoveReplayControlsProps {
  currentMoveIndex: number;
  totalMoves: number;
  onBackward: () => void;
  onForward: () => void;
  onExitReplay: () => void;
  disabled?: boolean;
  currentMoveNumber?: number; // Actual move number from snapshot
  totalGameMoves?: number; // Total moves in the game
}

const MoveReplayControls: React.FC<MoveReplayControlsProps> = ({
  currentMoveIndex,
  totalMoves,
  onBackward,
  onForward,
  onExitReplay,
  disabled = false,
  currentMoveNumber,
  totalGameMoves
}) => {
  const { colors } = useTheme();

  // Navigation bounds based on moveHistory indices
  const canGoBackward = currentMoveIndex > 0;
  const canGoForward = currentMoveIndex < totalMoves;
  const isAtLatest = currentMoveIndex === totalMoves;
  
  // Display using actual move numbers if provided, otherwise use index
  const displayMoveNum = currentMoveNumber ?? currentMoveIndex;
  const displayTotalMoves = totalGameMoves ?? totalMoves;
  const displayText = displayMoveNum === 0 ? 'Start' : `Move ${displayMoveNum}`;

  if (totalMoves === 0) return null;

  return (
    <div className={`${colors.bg.secondary} rounded-lg shadow-lg p-3 border ${colors.border.primary}`}>
      {/* Move Counter */}
      <div className={`text-center mb-2 ${colors.text.secondary}`}>
        <span className="text-base font-mono font-bold">
          {displayText}
        </span>
        <span className="text-sm"> / {displayTotalMoves}</span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={onBackward}
          disabled={!canGoBackward || disabled}
          className={`flex-1 py-2 px-4 rounded-md font-bold text-xl transition-colors ${
            !canGoBackward || disabled
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title="Previous move (←)"
        >
          &lt;
        </button>

        <button
          onClick={onForward}
          disabled={!canGoForward || disabled}
          className={`flex-1 py-2 px-4 rounded-md font-bold text-xl transition-colors ${
            !canGoForward || disabled
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title="Next move (→)"
        >
          &gt;
        </button>
      </div>

      {/* Return to Latest Button */}
      {!isAtLatest && (
        <button
          onClick={onExitReplay}
          disabled={disabled}
          className={`w-full py-2 px-4 rounded-md font-semibold text-sm transition-colors ${
            disabled
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          Return to Latest
        </button>
      )}
      
      {/* Keyboard Shortcuts Hint */}
      {isAtLatest && (
        <div className={`text-xs ${colors.text.muted} text-center`}>
          Use ← → arrow keys
        </div>
      )}
    </div>
  );
};

export default MoveReplayControls;
