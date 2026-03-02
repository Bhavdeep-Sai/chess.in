'use client';

import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface Player {
  userId?: string;
  guestId?: string;
  username?: string;
  isReady?: boolean;
}

interface GameState {
  players?: {
    white?: Player;
    black?: Player;
  };
  timeControl?: {
    initial?: number;
    increment?: number;
  };
}

interface RoomLobbyProps {
  roomId: string;
  gameState: GameState | null;
  playerColor: 'white' | 'black' | null;
  isReady: boolean;
  isHost: boolean;
  connectionStatus: string;
  onPlayerReady: () => void;
  onKickPlayer: (color: 'white' | 'black') => void;
  onCloseRoom: () => void;
  onLeaveGame: () => void;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({ 
  roomId, 
  gameState, 
  playerColor,
  isReady,
  isHost,
  connectionStatus,
  onPlayerReady,
  onKickPlayer,
  onCloseRoom,
  onLeaveGame
}) => {
  const theme = useTheme();

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const hasWhitePlayer = gameState?.players?.white?.userId || gameState?.players?.white?.guestId || gameState?.players?.white?.username;
  const hasBlackPlayer = gameState?.players?.black?.userId || gameState?.players?.black?.guestId || gameState?.players?.black?.username;
  const whiteReady = gameState?.players?.white?.isReady || false;
  const blackReady = gameState?.players?.black?.isReady || false;

  const getWaitingMessage = () => {
    if (!hasWhitePlayer && !hasBlackPlayer) {
      return "Waiting for players to join...";
    } else if (hasWhitePlayer && !hasBlackPlayer) {
      return "Waiting for a second player to join...";
    } else if (!hasWhitePlayer && hasBlackPlayer) {
      return "Waiting for white player to join...";
    } else if (!whiteReady && !blackReady) {
      return "Waiting for both players to ready up...";
    } else if (!whiteReady) {
      return "Waiting for white player to ready up...";
    } else if (!blackReady) {
      return "Waiting for black player to ready up...";
    }
    return "Starting game...";
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.colors.bg.primary} transition-colors duration-200 p-4`}>
      <div className="w-full max-w-2xl">
        {/* Room Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl lg:text-5xl font-bold ${theme.colors.text.primary} mb-4 flex items-center justify-center`}>
            <svg className={`w-10 h-10 mr-3 ${theme.colors.text.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
            Game Lobby
          </h1>
          <div className={`text-2xl ${theme.colors.text.accent} font-semibold mb-2`}>
            Room: {roomId}
          </div>
          {connectionStatus !== 'connected' && (
            <div className="flex items-center justify-center text-yellow-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-2"></div>
              Connecting...
            </div>
          )}
        </div>

        {/* Main Lobby Card */}
        <div className={`${theme.colors.bg.secondary} rounded-xl shadow-2xl p-8 border-2 ${theme.colors.border.primary}`}>
          {/* Player Status Role Badge */}
          {playerColor && (
            <div className="text-center mb-6">
              <div className={`inline-block px-6 py-3 rounded-full text-lg font-bold transition-colors duration-200 ${
                playerColor === 'white'
                  ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                  : 'text-white bg-gray-800 border-2 border-gray-600'
              }`}>
                Playing as {playerColor === 'white' ? '♔ White' : '♚ Black'}
              </div>
            </div>
          )}

          {/* Players Display */}
          <div className="space-y-4 mb-8">
            <h3 className={`text-xl font-bold ${theme.colors.text.primary} mb-4 text-center`}>
              Players
            </h3>

            {/* White Player */}
            <div className={`flex items-center justify-between p-5 rounded-lg border-2 transition-all duration-200 ${
              whiteReady 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                : theme.colors.bg.tertiary + ' ' + theme.colors.border.primary
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white border-2 border-gray-400 rounded shadow-md"></div>
                <div>
                  <span className={`font-bold text-lg ${theme.colors.text.primary}`}>
                    {gameState?.players?.white?.username || 'Waiting for player...'}
                  </span>
                  {whiteReady && (
                    <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium mt-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ready
                    </div>
                  )}
                </div>
              </div>
              <div className={`font-mono text-lg ${theme.colors.text.secondary}`}>
                {formatTime(gameState?.timeControl?.initial || 600000)}
              </div>
            </div>

            {/* Black Player */}
            <div className={`flex items-center justify-between p-5 rounded-lg border-2 transition-all duration-200 ${
              blackReady 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                : theme.colors.bg.tertiary + ' ' + theme.colors.border.primary
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-800 rounded shadow-md"></div>
                <div>
                  <span className={`font-bold text-lg ${theme.colors.text.primary}`}>
                    {gameState?.players?.black?.username || 'Waiting for player...'}
                  </span>
                  {blackReady && (
                    <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium mt-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ready
                    </div>
                  )}
                </div>
              </div>
              <div className={`font-mono text-lg ${theme.colors.text.secondary}`}>
                {formatTime(gameState?.timeControl?.initial || 600000)}
              </div>
            </div>
          </div>

          {/* Waiting Status */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <svg className={`w-20 h-20 ${theme.colors.text.muted} animate-pulse`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`text-xl ${theme.colors.text.secondary} font-medium`}>
              {getWaitingMessage()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isReady && (
              <button
                onClick={onPlayerReady}
                className={`w-full ${theme.colors.button.success} text-white py-4 text-lg font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg`}
              >
                Ready to Play
              </button>
            )}

            {isReady && (
              <div className={`text-center py-4 text-green-600 dark:text-green-400 font-bold text-lg flex items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-300 dark:border-green-700`}>
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                You&apos;re Ready - Waiting for opponent
              </div>
            )}

            {/* Host Controls */}
            {isHost && hasBlackPlayer && (
              <button
                onClick={() => onKickPlayer('black')}
                className={`w-full ${theme.colors.button.secondary} text-white py-3 rounded-lg transition-colors duration-200 text-sm`}
              >
                Remove {gameState?.players?.black?.username}
              </button>
            )}

            {/* Leave/Close Room */}
            {isHost ? (
              <button
                onClick={onCloseRoom}
                className={`w-full ${theme.colors.button.danger} text-white py-4 rounded-lg transition-colors duration-200 font-bold text-lg`}
              >
                Close Room
              </button>
            ) : (
              <button
                onClick={onLeaveGame}
                className={`w-full ${theme.colors.button.secondary} text-white py-4 rounded-lg transition-colors duration-200 font-bold text-lg`}
              >
                Leave Lobby
              </button>
            )}
          </div>
        </div>

        {/* Game Info Footer */}
        <div className={`mt-6 text-center ${theme.colors.text.muted} text-sm`}>
          <p>Time Control: {Math.floor((gameState?.timeControl?.initial || 600000) / 60000)} minutes</p>
          {gameState?.timeControl?.increment && (
            <p>Increment: +{gameState.timeControl.increment / 1000}s per move</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomLobby;
